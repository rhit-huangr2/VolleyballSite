
class RegistrationRepository {
    async findRegistered() {
        throw new Error('findRegistered() must be implemented');
    }

    async findWaitlisted() {
        throw new Error('findWaitlisted() must be implemented');
    }

    async addToRegistered(userId) {
        throw new Error('addToRegistered() must be implemented');
    }

    async addToWaitlist(userId) {
        throw new Error('addToWaitlist() must be implemented');
    }

    async remove(userId) {
        throw new Error('remove() must be implemented');
    }

    async clearAll() {
        throw new Error('clearAll() must be implemented');
    }
    
    async registerUser(userId, maxRegistered) {
        throw new Error('registerUser() must be implemented');
    }
}

module.exports = RegistrationRepository;
