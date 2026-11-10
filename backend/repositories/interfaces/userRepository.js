class UserRepository {
    async findAll() {
        throw new Error('findAll() not implemented');
    }

    async findById(id) {
        throw new Error('findById() not implemented');
    }

    async findByEmail(email) {
        throw new Error('findByEmail() must be implemented');
    }

    async create(user) {
        throw new Error('create() not implemented');
    }

    async update(id, changes) {
        throw new Error('update() not implemented');
    }

    async delete(id) {
        throw new Error('delete() not implemented');
    }
}

module.exports = UserRepository;