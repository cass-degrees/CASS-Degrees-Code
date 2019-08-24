/**
 * This file contains all javascript functions which are used globally in all pages
 * Linked to base.html
 */

/**
 *
 * @param checks the keys for the input box to make sure the user is entering numbers
 * @returns only backspace and space + numbers
 */

const STAFF_URL_PREFIX = "/staff/";

function checkKeys(event) {
    return event.keyCode === 9 || event.keyCode === 8 || event.keyCode === 46 ? true : !isNaN(Number(event.key));
}

/**
 * Makes the web page go back to the homepage
 */
function goBack() {
    window.location.href= STAFF_URL_PREFIX;
}

/**
 * Returns to the relevant list page
 */
function returnToList(pageName) {
    window.location.href = STAFF_URL_PREFIX + "list/?view="+pageName;
}
