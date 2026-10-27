
class ListService {
    constructor(registrationService, emailMetadataRepository) {
        this.registrationService = registrationService;
        this.emailMetadataRepository = emailMetadataRepository;
    }

    async getLists() {
        const playerLists =
            await this.registrationService.getLists();

        const emailMetadata =
            await this.emailMetadataRepository.getAll();

        return {
            ...playerLists,
            'email-metadata': emailMetadata
        };
    }
}

module.exports = ListService;
