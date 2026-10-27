
class RegistrationService {
    constructor(registrationRepository, userRepository, guestRepository) {
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.guestRepository = guestRepository;
        this.maxRegistered = 24;
    }

    async registerUser(userId) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        return this.registrationRepository.registerUser(
            userId,
            this.maxRegistered
        );
    }

    async registerGuest(guestId) {
        const guest = await this.guestRepository.findById(guestId);

        if (!guest) {
            throw new Error('Guest not found');
        }

        return this.registrationRepository.registerGuest(
            guestId,
            this.maxRegistered
        );
    }

    async getRegisteredUsers() {
        return this.registrationRepository.findRegistered();
    }

    async getWaitlistedUsers() {
        return this.registrationRepository.findWaitlisted();
    }

    async getLists() {
        const registeredUsers =
            await this.registrationRepository.findRegistered();

        const waitlistUsers =
            await this.registrationRepository.findWaitlisted();

        return {
            'registered-users': registeredUsers,
            'waitlist-users': waitlistUsers
        };
    }
}

module.exports = RegistrationService;
