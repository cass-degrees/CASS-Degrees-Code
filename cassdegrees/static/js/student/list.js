/* Small list.js helper for student portal search of plans */
var options = {
  valueNames: ['course-details'],
  fuzzySearch: {
    searchClass: "fuzzy-search",
    location: 0,
    distance: 1000,
    threshold: 0.3,
    multiSearch: true
  }
};

var programSearch = new List('programs', options);
