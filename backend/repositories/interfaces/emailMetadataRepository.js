
class EmailMetadataRepository {
    async get(key) {
        throw new Error('get() must be implemented');
    }

    async set(key, value) {
        throw new Error('set() must be implemented');
    }

    async getAll() {
        throw new Error('getAll() must be implemented');
    }
}

module.exports = EmailMetadataRepository;
