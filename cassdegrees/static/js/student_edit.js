/* Small list.js helper for student creation of plans */
var options = {
    valueNames: ['course-details'],
    page: 3,
    pagination: true,
    fuzzySearch: {
        searchClass: "fuzzy-search",
        location: 0,
        distance: 1000,
        threshold: 0.3,
        multiSearch: true
    }
};

var courseSearch = new List('courses', options);

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

    document.getElementById("main-form").submit();
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
