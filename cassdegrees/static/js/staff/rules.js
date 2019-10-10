//! Vue.js based means of adding/removing rules. Excludes serialization (see programmanagement.js)

var id_map = {};
var should_mark_newest_component = false;

// Stores a JSON of all rule names, for internal reference only.
const ALL_COMPONENT_NAMES = {
    'incompatibility': "Incompatibility",
    'program': 'Program',
    'subplan': "Subplan",
    'course': "Course",
    'course_list': "Course List",
    'course_requisite': "Course Requisite",
    'custom_text': "Custom (Text)",
    'custom_text_req': "Custom (Text)",
    'elective': "Elective Units",
    'either_or': "Either Or"
};

// Help for all components
const ALL_COMPONENT_HELP = {
    'incompatibility': "A rule which notes that students must not have picked any of the set of courses specified.",
    'program': 'A rule which enforces that only students from a particular course can take this option.',
    'subplan': "A rule which gives students a choice from a particular set of majors, minors, specialisations or " +
               "other subplans. The description here is used to describe the rule when displaying this rule to " +
               "students.",
    'course_list': "A rule which specifies that students should pick a certain amount of units from a set of available " +
              "courses.",
    'course_requisite': "A rule which specifies that students should have taken a set of courses before taking this " +
                        "one.",
    'custom_text': "If other rules don't entirely fit the requirements of a rule, the custom text field allows " +
                   "for the specification of other program content. Note that this isn't enforced in student-facing " +
                   "tools.",
    'custom_text_req': "If other rules don't entirely fit the requirements of a rule, the custom text field allows " +
                       "for the specification of other program content. Note that this isn't enforced in student-facing " +
                       "tools.",
    'elective': "A rule which allows students to choose any courses offered by the ANU as electives to fill a set" +
                " amount of units.",
    'either_or': "A rule which allows for the specification of sets of different paths that students can take. Each " +
                 "\"OR\" group is a collection of rules which must be completed if students were to pick that specific " +
                 "group."
};

// Translation table between internal names for components and human readable ones.
const COMPONENT_NAMES = {
    'subplan': "Subplan",
    'course_list': "Course List",
    'custom_text': "Custom (Text)",
    'elective': "Elective",
    'either_or': "Either Or"
};

// For either rule, list everything in the drop down menu except the "Either" option, or recursion will occur.
const EITHER_OR_COMPONENT_NAMES = {
    'subplan': "Subplan",
    'course_list': "Course List",
    'custom_text': "Custom (Text)",
    'elective': "Elective"
};

// components for subplans
const SUBPLAN_COMPONENT_NAMES = {
    'course_list': "Course List",
    'custom_text': "Custom (Text)",
    'either_or': "Either Or"
};

// either or for subplans
const SUBPLAN_EITHER_OR_COMPONENT_NAMES = {
    'course_list': "Course List",
    'custom_text': "Custom (Text)"
};

//
const REQUISITE_COMPONENT_NAMES = {
    'incompatibility': "Incompatibility",
    'program': 'Program',
    'elective': "Elective",
    'course_requisite': "Course Requisite",
    'custom_text_req': "Custom (Text)",
    'either_or': "Either Or"
};

const REQUISITE_EITHER_OR_COMPONENT_NAMES = {
    'program': 'Program',
    'elective': "Elective",
    'course_requisite': "Course",
    'custom_text_req': "Custom (Text)"
};

const LIST_TYPES = {
    'min': 'A Minimum Of',
    'exact': 'Exactly',
    'max': 'A Maximum Of',
    'min_max': "Minimum and Maximum"
};

const SUBPLAN_TYPES = {
    'MAJ': 'Majors',
    'MIN': 'Minors',
    'SPEC': 'Specialisations'
};

const SUBPLAN_UNITS = {
    'MAJ':  48,
    'MIN':  24,
    'SPEC': 24
};

const INFO_MSGS = {
    'course': '<p>This Requisite requires Courses in the system. Please create Courses ' +
        '<a href=javascript:document.getElementById("new_course_btn").click()>here</a> or bulk upload Courses ' +
        '<a href="/staff/bulk_upload/" target="_blank">here</a> first before creating this Requisite.</p>',
    'subplan': '<p>There are no subplans of the specified year and type in the system. Please create Subplans ' +
        '<a href=javascript:document.getElementById("new_subplan_btn").click()>here</a> first before creating this Requisite.</p>',
    'program': '<p>This Requisite requires Programs in the system. Please create Programs ' +
        '<a href="/staff/create/program/" target="_blank">here</a> first before creating this Requisite.</p>'
};

const app = new Vue({
    el: '#rulesContainer',
    data: {
        rules: []
    },
    methods: {
        redraw() {
            this.$children.forEach((child) => {
                child.do_redraw();
            });
        },
        /**
         * Submits Vue components into the form.
         */
        export_rules() {
            // Todo: remove existing success message if present prior to validation
            let valid = true;

            for (const index in app.$children) {
                valid = valid && app.$children[index].check_options(true);
            }

            // Serialize list structures - this doesn't translate well over POST requests normally.
            document.getElementById("rules").value = JSON.stringify(this.rules);

            return valid;
        }
    },
    mounted() {
        const reqs = document.getElementById("rules").value.trim();
        if (reqs.length > 0) {
            const parsed = JSON.parse(reqs);
            if (parsed != null) {
                this.rules = parsed;
            }
        }
    }
});

function isValidUnitCount(value) {
    // Go through each child and sum up all of the units
    const units = {"exact": 0, "max": 0, "min": 0};
    for (const child of app.$children) {
        const child_units = child.count_units();
        for (const key in child_units) {
            units[key] += child_units[key];
        }
    }

    // Return true if the specified value is within the unit count bounds
    return units.exact + units.min <= value && value <= units.exact + units.min + units.max;
}

// Resets the on-screen position of a particular draggable
function resetDraggable(target) {
    target.style.webkitTransform =
        target.style.transform = null;
}

// Moves the element to the x, y position and scales it
function dragMoveListener(event, x, y, origin_x, origin_y) {
    var target = event.target.parentNode;
    target.style.transformOrigin = origin_x + 'px ' + origin_y + 'px';

    target.style.webkitTransform =
        target.style.transform =
            'translate(' + (event.pageX - x) + 'px, ' + (event.pageY - y) + 'px) scale(0.33)';
}

interact('.draggable-rule').ignoreFrom('.btn-snall').draggable({
    inertia: false,
    autoScroll: true,

    x: 0,
    y: 0,
    origin_x: 0,
    origin_y: 0,

    onstart: function(event) {
        let id = event.target.parentNode.parentNode.getAttribute('drag_id');
        event.target.parentNode.parentNode.classList.add('hidden-outer');

        // Make the class look like it's hovering
        event.target.parentNode.classList.add('hovering');
        // Unhide all of the drop zones
        let dropzones = document.getElementsByClassName('dropzone dropzone-area');
        for (let dropzone of dropzones) {
            dropzone.hidden = false;
        }
        // Hide all dropzones belonging to the current component
        for (let dropzone of event.target.parentNode.parentNode.getElementsByClassName('dropzone dropzone-area'))
            dropzone.hidden = true;

        // If the current rule is an OR rule, mark it as such and hide all internal OR rule components
        let is_or_rule = false;
        if (id.split('_').length < 3) {
            // If the currently held component is an OR rule
            let current_rule = app.$children[0].$children[id.split('_')[1]];
            if (current_rule && current_rule.$children[0].is_eitheror) {
                is_or_rule = true;
                for (let or_group of document.getElementsByClassName('draggable draggable-group'))
                    for (let dropzone of or_group.getElementsByClassName('dropzone dropzone-area'))
                        dropzone.hidden = true;
            }
        }

        for (let rule of document.getElementsByClassName('rule_active_visual'))
            rule.classList.remove('rule_active_visual');

        // Set the original X and Y position of the element
        this.x = event.pageX;
        this.y = event.pageY;
        this.origin_x = event.x0-event.rect.left;
        this.origin_y = event.y0-event.rect.top;

        // Changes the Y value by the amount of dropzones that will appear
        // To my knowledge, there is no reliable way to get this information otherwise
        let or_y = 0;
        let dropzone_height = 72;
        for (let dropzone of dropzones) {
            // Set the dropzone id
            let dz_id = dropzone.parentNode.getAttribute('drag_id');

            // If the dropzone is in an OR rule, don't add the height directly in case we are dragging the OR rule
            if (dz_id.split('_').length === 3){
                // If the dragged rule is in the OR rule, add the accumulated OR values and don't add any more dropzones
                if(dz_id === id) {
                    this.y += or_y;
                    break;
                }
                // Add 1 dropzone height to the OR rule count
                or_y += dropzone_height;
            }
            // If the dropzone is not in an OR rule
            else{
                // If we have found the dragged rule, don't ad any more dropzones
                if(dz_id === id)
                    break;
                // If an or rule was just passed, add all of the accumulated dropbox heights
                if (or_y > 0) {
                    if (! is_or_rule)
                        this.y += or_y;
                    or_y = 0;
                }
                // Add the current dropbox height
                this.y += dropzone_height;
            }

        }
    },
    onmove: function(event) {
        dragMoveListener(event, this.x, this.y, this.origin_x, this.origin_y)
    },
    onend: function(event) {
        // Flag this course to be moved back to the start
        event.target.parentNode.classList.remove("hovering");
        event.target.parentNode.parentNode.classList.remove('hidden-outer');
        var dropzones = document.getElementsByClassName('dropzone dropzone-area');
        for (var dropzone of dropzones)
            dropzone.hidden = true;

        resetDraggable(event.target.parentNode);
    }
});

interact('.dropzone').dropzone({
    accept: '.draggable-rule',
    overlap: 'pointer',

    ondragenter: function (event) {
        event.target.classList.add("hover");
    },
    ondragleave: function (event) {
        event.target.classList.remove("hover");
    },
    ondrop: function (event) {
        var courseObject = event.relatedTarget;
        var target = event.target;

        // Remove our hover
        target.classList.remove("hover");

        // Get IDs of focus and target objects, which provides information on their location
        var focus_id = courseObject.parentNode.parentNode.getAttribute('drag_id');
        var target_id = target.parentNode.getAttribute('drag_id');

        // Deconstruct the vue rule information
        var old_parent_id = parseInt(focus_id .split('_')[0]);
        var new_parent_id = parseInt(target_id .split('_')[0]);
        var old_component_id = parseInt(focus_id .split('_')[1]);
        var new_component_id = parseInt(target_id .split('_')[1]);
        var old_group_id;
        var new_group_id;

        // Get the old and new parent components, as well as the current vue component
        var new_parent = id_map[new_parent_id];
        var old_parent = id_map[old_parent_id];
        var current_component = old_parent.$children[old_component_id];

        // If the component that the current rule is moving from is an either-or rule, get more detailed rule information
        if (old_parent.is_eitheror) {
            old_group_id = old_component_id;
            old_component_id = parseInt(focus_id.split('_')[2]);
            current_component = old_parent.find_rule(old_parent.details.either_or[old_group_id][old_component_id])
        }

        if (new_parent.is_eitheror){
            // Update the rule information to account for the OR rule. Add 1 to the component ID to get the correct position
            new_group_id = new_component_id;
            new_component_id = parseInt(target_id .split('_')[2]) + 1;

            // Insert the new element in to the rules
            new_parent.details.either_or[new_group_id].splice(new_component_id, 0, current_component.details);
            // If the new parent is different from the old one, add the rule values to it
            if (old_parent_id !== new_parent_id)
                new_parent.$forceUpdate();
            // If the new parent is the same, and the group is the same, increment the old component ID if it should change
            else if (old_group_id === new_group_id &&
                    new_component_id < old_component_id){
                old_component_id += 1;
            }

            // Remove the old rule
            if (old_parent.is_eitheror)
                old_parent.remove(old_component_id, old_group_id);
            else
                old_parent.remove(old_component_id);

            new_parent.update_units();
        }
        // If the new parent is not an OR rule (meaning it is a rule-container)
        else{
            // Increment new component ID to correctly identify the insertion location
            new_component_id += 1;

            // Insert new rule in to the parent
            new_parent.rules.splice(new_component_id, 0, current_component.details);

            // If the new parent is the same, increment the old component ID if it should change
            if (new_component_id < old_component_id){
                old_component_id += 1;
            }

            // Remove the old rule
            if (old_parent.is_eitheror)
                old_parent.remove(old_component_id, old_group_id);
            else
                old_parent.remove(old_component_id);
        }

        should_mark_newest_component = false;
    }
});

interact('.draggable-group').ignoreFrom('.rule-container').draggable({
    inertia: false,
    autoScroll: true,

    x: 0,
    y: 0,
    origin_x: 0,
    origin_y: 0,

    onstart: function(event) {
        // Make the class look like it's hovering
        event.target.parentNode.classList.add('hovering');
        event.target.parentNode.classList.add('hidden-outer');
        // Unhide all of the drop zones, then re-hide the one belowe the currently held element
        var dropzones = document.getElementsByClassName('group-dropzone dropzone-area');
        for (var dropzone of dropzones) {
            dropzone.hidden = false;
        }
        event.target.parentNode.getElementsByClassName('group-dropzone dropzone-area')[0].hidden = true;

        // Set the original X and Y position of the element
        this.x = event.pageX;
        this.y = event.pageY;
        this.origin_x = event.x0-event.rect.left;
        this.origin_y = event.y0-event.rect.top;

        // Changes the Y value by the amount of dropzones that will appear
        // To my knowledge, there is no reliable way to get this information otherwise
        var dropzone_height = 72;
        var id = event.target.getAttribute('drag_id');
        for (var dropzone of dropzones) {
            // Set the dropzone id
            var dz_id = dropzone.parentNode.getAttribute('drag_id');

            // If we have found the dragged rule, don't ad any more dropzones
            if(dz_id === id)
                break;
            // Add the current dropbox height
            this.y += dropzone_height;

        }
    },
    onmove: function(event) {
        dragMoveListener(event, this.x, this.y, this.origin_x, this.origin_y)
    },
    onend: function(event) {
        // Flag this course to be moved back to the start
        event.target.parentNode.classList.remove("hovering");
        event.target.parentNode.classList.remove('hidden-outer');
        var dropzones = document.getElementsByClassName('group-dropzone dropzone-area');
        for (var dropzone of dropzones)
            dropzone.hidden = true;

        resetDraggable(event.target.parentNode);
    }
});

interact('.group-dropzone').dropzone({
    accept: '.draggable-group',
    overlap: 'pointer',

    ondragenter: function (event) {
        event.target.classList.add("hover");
    },
    ondragleave: function (event) {
        event.target.classList.remove("hover");
    },
    ondrop: function (event) {
        var courseObject = event.relatedTarget;
        var target = event.target;

        // Remove our hover
        target.classList.remove("hover");

        // Get IDs of focus and target objects, which provides information on their location
        var focus_id = courseObject.getAttribute('drag_id');
        var target_id = target.parentNode.getAttribute('drag_id');

        // Deconstruct the vue rule information
        var old_parent_id = parseInt(focus_id .split('_')[0]);
        var new_parent_id = parseInt(target_id .split('_')[0]);
        var old_group_id = parseInt(focus_id .split('_')[1]);
        var new_group_id = parseInt(target_id .split('_')[1]);

        // Get the old and new parent components, as well as the current vue component
        var new_parent = id_map[new_parent_id];
        var old_parent = id_map[old_parent_id];
        var current_group = old_parent.details.either_or[old_group_id];

        // Add 1 to the new group ID to get the correct position
        new_group_id += 1;

        // Insert the new element in to the rules
        new_parent.details.either_or.splice(new_group_id, 0, current_group);
        // If the new parent is the same, and the group is the same, increment the old component ID if it should change
        if (old_parent_id === new_parent_id && new_group_id < old_group_id){
            old_group_id += 1;
        }
        // Update the new rule
        new_parent.update_units();
        new_parent.do_redraw();

        // Remove the old rule
        old_parent.remove_group(old_group_id);

        should_mark_newest_component = false;
    }
});