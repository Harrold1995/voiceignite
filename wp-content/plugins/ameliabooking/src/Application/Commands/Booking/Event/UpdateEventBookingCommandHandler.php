<?php

namespace AmeliaBooking\Application\Commands\Booking\Event;

use AmeliaBooking\Application\Commands\CommandHandler;
use AmeliaBooking\Application\Commands\CommandResult;
use AmeliaBooking\Application\Common\Exceptions\AccessDeniedException;
use AmeliaBooking\Application\Services\Booking\EventApplicationService;
use AmeliaBooking\Application\Services\User\UserApplicationService;
use AmeliaBooking\Domain\Common\Exceptions\InvalidArgumentException;
use AmeliaBooking\Domain\Entity\Booking\Appointment\CustomerBooking;
use AmeliaBooking\Domain\Entity\Booking\Event\CustomerBookingEventTicket;
use AmeliaBooking\Domain\Entity\Booking\Event\Event;
use AmeliaBooking\Domain\Entity\Booking\Event\EventTicket;
use AmeliaBooking\Domain\Entity\Entities;
use AmeliaBooking\Domain\Entity\User\AbstractUser;
use AmeliaBooking\Domain\Factory\Booking\Event\CustomerBookingEventTicketFactory;
use AmeliaBooking\Domain\Factory\Coupon\CouponFactory;
use AmeliaBooking\Domain\Services\Reservation\ReservationServiceInterface;
use AmeliaBooking\Domain\Services\Settings\SettingsService;
use AmeliaBooking\Domain\ValueObjects\Json;
use AmeliaBooking\Domain\ValueObjects\Number\Integer\IntegerValue;
use AmeliaBooking\Domain\ValueObjects\String\BookingStatus;
use AmeliaBooking\Infrastructure\Common\Exceptions\QueryExecutionException;
use AmeliaBooking\Infrastructure\Repository\Booking\Appointment\CustomerBookingRepository;
use AmeliaBooking\Infrastructure\Repository\Booking\Event\CustomerBookingEventTicketRepository;
use Interop\Container\Exception\ContainerException;
use Slim\Exception\ContainerValueNotFoundException;

/**
 * Class UpdateEventBookingCommandHandler
 *
 * @package AmeliaBooking\Application\Commands\Booking\Event
 */
class UpdateEventBookingCommandHandler extends CommandHandler
{
    /**
     * @param UpdateEventBookingCommand $command
     *
     * @return CommandResult
     * @throws ContainerValueNotFoundException
     * @throws AccessDeniedException
     * @throws QueryExecutionException
     * @throws ContainerException
     * @throws InvalidArgumentException
     */
    public function handle(UpdateEventBookingCommand $command)
    {
        $result = new CommandResult();

        /** @var UserApplicationService $userAS */
        $userAS = $this->getContainer()->get('application.user.service');

        /** @var SettingsService $settingsDS */
        $settingsDS = $this->container->get('domain.settings.service');

        /** @var AbstractUser $user */
        $user = $this->container->get('logged.in.user');

        if (!$this->getContainer()->getPermissionsService()->currentUserCanWrite(Entities::EVENTS)) {
            $user = $userAS->getAuthenticatedUser($command->getToken(), false, 'providerCabinet');

            if ($user === null) {
                $result->setResult(CommandResult::RESULT_ERROR);
                $result->setMessage('Could not retrieve user');
                $result->setData(
                    [
                        'reauthorize' => true
                    ]
                );

                return $result;
            }
        }

        $this->checkMandatoryFields($command);

        $bookingData = $command->getField('bookings') ? $command->getField('bookings')[0] : null;

        /** @var CustomerBookingRepository $customerBookingRepository */
        $customerBookingRepository = $this->container->get('domain.booking.customerBooking.repository');

        /** @var EventApplicationService $eventAS */
        $eventAS = $this->container->get('application.booking.event.service');

        /** @var ReservationServiceInterface $reservationService */
        $reservationService = $this->container->get('application.reservation.service')->get(Entities::EVENT);

        /** @var CustomerBooking $customerBooking */
        $customerBooking = $customerBookingRepository->getById((int)$command->getField('id'));

        /** @var Event $event */
        $event = $reservationService->getReservationByBookingId($customerBooking->getId()->getValue());

        if ($user &&
            $userAS->isProvider($user) &&
            (
                !$settingsDS->getSetting('roles', 'allowWriteEvents') ||
                !$event->getProviders()->keyExists($user->getId()->getValue())
            )
        ) {
            throw new AccessDeniedException('You are not allowed to update booking');
        }

        $isBookingStatusChanged =
            $bookingData &&
            isset($bookingData['status']) &&
            $customerBooking->getStatus()->getValue() !== $bookingData['status'];

        if (isset($bookingData['customFields'])) {
            $customerBooking->setCustomFields(new Json(json_encode($bookingData['customFields'])));
        }

        if (isset($bookingData['persons'])) {
            $customerBooking->setPersons(new IntegerValue($bookingData['persons']));
        }

        if (isset($bookingData['status'])) {
            $customerBooking->setStatus(new BookingStatus($bookingData['status']));
        }

        if (isset($bookingData['coupon'])) {
            $customerBooking->setCoupon(CouponFactory::create($bookingData['coupon']));
        }


        /** @var CustomerBookingEventTicketRepository $bookingEventTicketRepository */
        $bookingEventTicketRepository =
            $this->container->get('domain.booking.customerBookingEventTicket.repository');

        if ($event->getCustomTickets() &&
            $event->getCustomTickets()->length()
        ) {
            $event->setCustomTickets($eventAS->getTicketsPriceByDateRange($event->getCustomTickets()));

            if (!empty($bookingData['ticketsData'])) {
                foreach ($bookingData['ticketsData'] as $ticketBooking) {
                    if (!$ticketBooking['id'] && $ticketBooking['persons']) {
                        /** @var EventTicket $ticket */
                        $ticket = $event->getCustomTickets()->getItem($ticketBooking['eventTicketId']);

                        $ticketPrice = $ticket->getDateRangePrice() ?
                            $ticket->getDateRangePrice()->getValue() : $ticket->getPrice()->getValue();

                        /** @var CustomerBookingEventTicket $bookingEventTicket */
                        $bookingEventTicket = CustomerBookingEventTicketFactory::create(
                            [
                                'eventTicketId'     => $ticketBooking['eventTicketId'],
                                'customerBookingId' => $customerBooking->getId()->getValue(),
                                'persons'           => $ticketBooking['persons'],
                                'price'             => $ticketPrice,
                            ]
                        );

                        $bookingEventTicketRepository->add($bookingEventTicket);
                    } else if ($ticketBooking['id'] && $ticketBooking['persons']) {
                        $bookingEventTicketRepository->update($ticketBooking['id'], $ticketBooking);
                    } else if ($ticketBooking['id'] && !$ticketBooking['persons']) {
                        $bookingEventTicketRepository->delete($ticketBooking['id']);
                    }
                }
            }
        }

        $customerBookingRepository->update($customerBooking->getId()->getValue(), $customerBooking);

        $result->setResult(CommandResult::RESULT_SUCCESS);
        $result->setMessage('Successfully booking');
        $result->setData(
            [
                'type'                     => Entities::EVENT,
                Entities::EVENT            => $event->toArray(),
                Entities::BOOKING          => $customerBooking->toArray(),
                'appointmentStatusChanged' => false,
                'bookingStatusChanged'     => $isBookingStatusChanged
            ]
        );

        return $result;
    }
}
