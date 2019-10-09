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

// Attempt to replace all checkboxes on the page with modern equivalents, noting that browsers don't typically
// allow for custom checkbox styling, we have to implement this logic ourselves.
// This preserves all element semantics, including JavaScript event handlers and so forth.
function updateCheckboxes() {
    document.querySelectorAll("input[type=checkbox]").forEach(function(element) {
        if (element.classList.contains("custom-checkbox")) {
            return;
        }

        element.classList.add("custom-checkbox");

        const parentElement = element.parentElement;

        // Create a new subelement to move this element to
        const newChild = document.createElement("div");
        newChild.classList.add("pretty", "p-icon");
        newChild.style = "font-size: 25px";

        // Create a sibling element with a label which can be mutated by CSS
        const newSibling = document.createElement("div");
        newSibling.classList.add("state", "p-primary");

        // Add a font awesome icon
        const fontAwesomeIcon = document.createElement("i");
        fontAwesomeIcon.classList.add("icon", "fa", "fa-check");

        // Create the label, which the CSS library injects onto
        const newLabel = document.createElement("label");
        newLabel.innerHTML = "&nbsp;";
        newSibling.appendChild(fontAwesomeIcon);
        newSibling.appendChild(newLabel);

        // Composite our new subelement together
        newChild.appendChild(parentElement.removeChild(element));
        newChild.appendChild(newSibling);

        // By now, we have the following:
        // <div class="pretty p-default">
        //    <input type="checkbox" (any other attributes on the original checkbox, including name/id/events)>
        //    <div class="state p-primary">
        //      <i class="icon fa fa-check"></i>
        //      <label>&nbsp;</label>
        //    </div>
        // </div>

        // Insert this new big element into our original parent, as if nothing ever happened
        parentElement.appendChild(newChild);
    });
}

document.addEventListener("DOMContentLoaded", updateCheckboxes);

// Try to catch instances where users might enter text
let pageDirtied = false;
let contentsSubmission = false;

let appContents;
let globalReqsContents;

document.addEventListener("DOMContentLoaded", () => {
    // Catch input boxes
    document.querySelectorAll("input").forEach(function(element) {
        element.addEventListener('change', () => {
            if (!pageDirtied) {
                console.log("Marking page as dirtied (input changed)");
                pageDirtied = true;
            }
        });
    });

    // Check to see if we are submitting a form box and ignore if if so
    document.querySelectorAll("form").forEach(function(element) {
        element.addEventListener('submit', () => {
            console.log("Form submission - skipping dirtied check");
            contentsSubmission = true;
        });
    });

    // Capture Vue data when ready
    if (Vue) {
        Vue.nextTick(() => {
            if (app !== undefined) {
                appContents = JSON.stringify(app.$data);
            }

            if (globalRequirementsApp !== undefined) {
                globalReqsContents = JSON.stringify(globalRequirementsApp.$data);
            }
        });
    }
});

window.addEventListener('beforeunload', function (e) {
    // We don't want to warn if we are submitting a form of some kind
    if (contentsSubmission) {
        return;
    }

    // Try to see if a Vue element has been modified
    if (app !== undefined && appContents !== JSON.stringify(app.$data)) {
        console.log("Marking page as dirtied (app contents changed)");
        pageDirtied = true;
    }

    if (globalRequirementsApp !== undefined && globalReqsContents !== JSON.stringify(globalRequirementsApp.$data)) {
        console.log("Marking page as dirtied (global requirements contents changed)");
        pageDirtied = true;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
    if (pageDirtied) {
        e.preventDefault();
        // Message typically ignored - Chrome/Firefox generally use their own generic message
        // here to prevent phishing/etc.
        e.returnValue = 'Unsaved content - are you sure you wish to continue?';
    }
});
