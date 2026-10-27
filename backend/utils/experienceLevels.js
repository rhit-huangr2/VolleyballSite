
const EXPERIENCE_LEVELS = {
    1: 'Beginner',
    4: 'Intermediate',
    7: 'Advanced',
    10: 'Professional'
};

function getExperienceLevelLabel(value) {
    return EXPERIENCE_LEVELS[value] ?? 'Unknown experience level';
}

function getExperienceLevelValue(label) {
    const normalizedLabel = String(label).trim().toLowerCase();

    const entry = Object.entries(EXPERIENCE_LEVELS).find(
        ([, description]) =>
            description.toLowerCase() === normalizedLabel
    );

    return entry ? Number(entry[0]) : null;
}

module.exports = {
    EXPERIENCE_LEVELS,
    getExperienceLevelLabel,
    getExperienceLevelValue
};
