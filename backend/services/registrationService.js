class RegistrationService {
    constructor(registrationRepository, userRepository) {
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
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

    async getRegisteredUsers() {
        return this.registrationRepository.findRegistered();
    }

    async getWaitlistedUsers() {
        return this.registrationRepository.findWaitlisted();
    }
}

module.exports = RegistrationService;