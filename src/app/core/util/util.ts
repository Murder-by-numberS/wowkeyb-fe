export const formatString = (input: string) => {
    return input
        .trim()
        .toLowerCase()
        .replace(/'/g, '')    // Remove apostrophes entirely (don't replace with hyphen)
        .replace(/\s+/g, '-'); // Replace spaces with dashes
}

export const formatClassName = (className: string) => {
    // Special handling for multi-word class names
    const classMapping = {
        'death knight': 'deathknight',
        'demon hunter': 'demonhunter'
    };

    const lowerClassName = className.toLowerCase().trim();
    return classMapping[lowerClassName] || formatString(className);
}
