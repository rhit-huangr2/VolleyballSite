
const {
    getExperienceLevelValue
} = require('../utils/experienceLevels');

class GuestService {
    constructor(guestRepository, userRepository) {
        this.guestRepository = guestRepository;
        this.userRepository = userRepository;
    }

    async getAllGuests() {
        return this.guestRepository.findAll();
    }

    async getGuestById(id) {
        return this.guestRepository.findById(id);
    }

    async getGuestByEmail(email) {
        return this.guestRepository.findByEmail(email);
    }


    async createGuest(guest) {
        if (!guest.name || !guest.email || !guest.registeredByEmail) {
            throw new Error(
                'Guest name, email, and registering member email are required'
            );
        }

        const registeringUser = await this.userRepository.findByEmail(
            guest.registeredByEmail
        );

        if (!registeringUser) {
            throw new Error('Registering member not found');
        }

        const existingGuest = await this.guestRepository.findByEmail(
            guest.email
        );

        if (existingGuest) {
            throw new Error('This email is already in use');
        }

        const existingUser = await this.userRepository.findByEmail(
            guest.email
        );

        if (existingUser) {
            throw new Error('This email is already in use');
        }

        const rating = getExperienceLevelValue(guest.experienceLevel);

        if (rating === null) {
            throw new Error('Invalid experience level');
        }

        return this.guestRepository.create({
            name: guest.name.trim(),
            email: guest.email.trim(),
            guestOfUserId: registeringUser.id,
            rating
        });
    }


    async updateGuest(id, changes) {
        if (Object.hasOwn(changes, 'rating')) {
            const rating = changes.rating;

            if (
                !Number.isInteger(rating) ||
                rating < -1 ||
                rating > 10
            ) {
                throw new Error('Rating must be an integer between -1 and 10');
            }
        }

        return this.guestRepository.update(id, changes);
    }

    async deleteGuest(id) {
        return this.guestRepository.delete(id);
    }
}

module.exports = GuestService;
