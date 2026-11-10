
const {
    EXPERIENCE_LEVELS,
    getExperienceLevelLabel,
    getExperienceLevelValue
} = require('./utils/experienceLevels');

for (const [rating, label] of Object.entries(EXPERIENCE_LEVELS)) {
    const numericRating = Number(rating);

    console.assert(
        getExperienceLevelValue(label) === numericRating,
        `Failed to convert "${label}" to ${rating}`
    );

    console.assert(
        getExperienceLevelLabel(numericRating) === label,
        `Failed to convert ${rating} to "${label}"`
    );
}

console.assert(
    getExperienceLevelValue(' intermediate ') === 4,
    'Case-insensitive conversion failed'
);

console.assert(
    getExperienceLevelValue('Unknown') === null,
    'Invalid labels should return null'
);

console.log('Experience-level tests completed.');
