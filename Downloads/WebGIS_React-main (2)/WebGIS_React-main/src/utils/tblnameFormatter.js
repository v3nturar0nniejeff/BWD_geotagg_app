export const formatLayerName = (layerName) => {
  // List of words to keep lowercase
  const lowercaseWords = [
    "and",
    "for",
    "of",
    "the",
    "in",
    "on",
    "at",
    "to",
    "with",
    "by",
  ];

  // Process the column name
  const words = layerName
    .replace(/[^a-zA-Z\s_]/g, "") // Remove numbers and special characters except underscore
    .split("_"); // Split by underscore

  // Format each word with proper casing
  const formattedWords = words.map((word, index) => {
    // If the word is all caps (like an acronym), leave it as-is
    if (word === word.toUpperCase() && word.length > 1) {
      return word;
    }

    // Convert word to lowercase for comparison
    const lowerWord = word.toLowerCase();

    // Only keep connecting words lowercase
    if (index !== 0 && lowercaseWords.includes(lowerWord)) {
      return lowerWord;
    } else {
      // Capitalize all other words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
  });

  return formattedWords.join(" ").trim(); // Join words with space and trim
};
