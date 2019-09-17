/* Small list.js helper for student creation of plans */

var options = {
    valueNames: ['course-name', 'course-code'],
    page: 4,
    pagination: true
};

var courseSearch = new List('courses', options);

// Create fuse.js instance for searching
var fuseOptions = {
    shouldSort: true,
    //tokenize: true,
    findAllMatches: false,
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['course-name', 'course-code']
};

var fuse = new Fuse(courseSearch.toJSON(), fuseOptions);

function searchQuery(query) {
    if (query.length === 0) {
        courseSearch.filter();
    } else {
        var results = fuse.search(query);

        // Display top 3 pages of results
        results = results.slice(0, 4 * 3);

        // Rotate results to use course codes as keys
        var sortedResults = {};
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            result.sortPos = i;
            sortedResults[result['course-code']] = result;
        }

        courseSearch.filter(function(item) {
            return sortedResults[item.values()["course-code"]];
        });
    }
}

// Script to allow interactivity in the popup menu
function setupPopup() {
    var plan_link = document.getElementById("plan_link");

    // Ensure that plan links exist before trying to inject event handlers
    if (plan_link === undefined) {
        return;
    }

    // Plan link implies these:
    var copy = document.getElementById("copy_to_clipboard");
    var close = document.getElementById("close_modal");

    plan_link.onclick = function () {
        this.select();
    };
    copy.onclick = function () {
        plan_link.select();
        plan_link.setSelectionRange(0, 99999);
        document.execCommand("copy");
        document.getElementById("modal_content").innerHTML = "(Copied)";
    };
    close.onclick = function () {
        document.getElementById("plan_popup").remove();
    };
}

// Gets metadata from all applied courses and stores it
function prepareSubmit(action) {
    var elements = document.getElementsByClassName("course-drop");
    var course_codes = [];

    for (var element_index = 0; element_index < elements.length; element_index++) {
        var element = elements[element_index];
        course_codes.push(element.getAttribute("data-course-code"));
    }

    document.getElementById("plan-courses").value = JSON.stringify(course_codes);
    document.getElementById("action_to_perform").value = action;

    if (action === "pdf")
        // Ensure that the PDF opens in a new page
        document.getElementById("main-form").setAttribute("target", "_blank");

    document.getElementById("hidden_comments").value = document.getElementById("comments").value;
    document.getElementById("main-form").submit();
   
    if (action === "pdf")
        document.getElementById("main-form").removeAttribute("target");
}

// Parses course codes from the document
function readCourseCodes() {
    var elements = document.getElementsByClassName("course-drop");
    var raw_course_codes = document.getElementById("plan-courses").value;
    if (raw_course_codes === undefined || raw_course_codes.length === 0) {
        return;
    }

    var course_codes = JSON.parse(raw_course_codes);

    for (var element_index = 0; element_index < elements.length; element_index++) {
        var value = course_codes[element_index];
        if (value == null || !value) {
            continue;
        }

        var element = elements[element_index];
        element.setAttribute("data-course-code", value);
        element.getElementsByClassName("course-code")[0].innerText = value;
    }
}

readCourseCodes();

// Resets the on-screen position of a particular draggable
function resetDraggable(eventTarget) {
    var target = eventTarget.firstElementChild;
    var x = 0;
    var y = 0;
    target.style.webkitTransform =
        target.style.transform =
            'translate(' + x + 'px, ' + y + 'px)';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

// Removes a droppable boxes value
function clearCourse(target) {
    target.removeAttribute("data-course-code");
    target.getElementsByClassName("course-code")[0].innerText = "";
}

// From https://interactjs.io/
function dragMoveListener(event) {
    var target = event.target.firstElementChild;

    // keep the dragged position in the data-x/data-y attributes
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
        target.style.transform =
            'translate(' + x + 'px, ' + y + 'px)';

    // update the position attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

interact('.draggable-course').draggable({
    inertia: false,
    autoScroll: true,

    onmove: dragMoveListener,
    onend: function(event) {
        // Flag this course to be moved back to the start
        resetDraggable(event.target);
    }
});


interact('.dropzone').dropzone({
    accept: '.draggable-course',
    overlap: 'pointer',

    ondragenter: function (event) {
        var target = event.target;
        // Discover if this element is empty
        if (target.getAttribute("data-course-code")) {
            return;
        }

        target.classList.add("hover");
    },
    ondragleave: function (event) {
        event.target.classList.remove("hover");
    },
    ondrop: function (event) {
        var courseObject = event.relatedTarget;
        var target = event.target;

        // Remove our hover
        target.classList.remove("hover");

        // Discover if this element is empty
        if (event.target.getAttribute("data-course-code")) {
            return;
        }

        // Get the course code for this
        var course = courseObject.getAttribute("data-course-code") ||
            courseObject.getElementsByClassName("course-code-entry")[0].value;
        target.setAttribute("data-course-code", course);
        target.getElementsByClassName("course-code")[0].innerText = course;
    }
});


// When selecting a sublan from a list of subplans, sets the chosen subplan as the saved value
function subplanSelect(element, year){
    var inputField = element.parentNode;
    while (inputField.tagName !== 'INPUT') {
        inputField = inputField.previousSibling;
    }
    inputField.value = element.attributes['name'].value;

    // Set the box values
    var request = new XMLHttpRequest();
    request.addEventListener("load", function() {
        var rule = JSON.parse(request.response)[0]["rules"];
        // Set the card to be the first 'div' block below the subplan entry field
        var card = inputField.parentNode.nextSibling;
        while (card.tagName !== 'DIV')
            card = card.nextSibling;
        // Iterate over each course list rule (e.g. [18 units from X, 6 units from Y])
        for (var i=0; i<rule.length; i++){
            // If the number of courses matches the unit count and an exact number of units needs to be completed
            if (rule[i]["codes"].length*6 === parseInt(rule[i]["unit_count"]) && rule[i]["list_type"] === "exact"){
                // For every compulsory course code, add that course to the next card
                for (var j=0; j<rule[i]["codes"].length; j++){
                    var course = rule[i]["codes"][j];
                    card.childNodes[0].setAttribute("data-course-code", course);
                    card.getElementsByClassName("course-code")[0].innerText = course;

                    do {
                        card = card.nextSibling
                    } while (card.tagName !== 'DIV');
                }
            }
        }
        // Clear all remaining cards in the subplan
        while(card.nextSibling) {
            if (card.tagName === 'DIV')
                clearCourse(card.childNodes[0]);
            card = card.nextSibling;
        }
    });

    // Function to sanitise course code
    function parseCode(course){
        return course.substring(0, 4)+parseInt(course.substring(4))
    }

    var code = inputField.value.split(' ', 1);
    request.open("GET", "/api/search/?select=code,year,rules&from=subplan&year="+parseInt(year)+"&code="+parseCode(code));
    request.send();
}


// Toggles whether the next div is shown or hidden
function show_hide(element) {
    div = element.nextSibling;
    while (div.tagName !== 'DIV') {
        div = div.nextSibling;
    }
    if (div.style.display === "none") {
        div.style.display = "block";
        element.innerHTML = "Hide Options";
    } else {
        div.style.display = "none";
        element.innerHTML = "Show Options";
    }
}
