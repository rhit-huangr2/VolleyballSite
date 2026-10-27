
class GuestRepository {
    async findAll() {
        throw new Error('findAll() must be implemented');
    }

    async findById(id) {
        throw new Error('findById() must be implemented');
    }

    async findByEmail(email) {
        throw new Error('findByEmail() must be implemented');
    }

    async create(guest) {
        throw new Error('create() must be implemented');
    }

    async update(id, changes) {
        throw new Error('update() must be implemented');
    }

    async delete(id) {
        throw new Error('delete() must be implemented');
    }
}

module.exports = GuestRepository;
