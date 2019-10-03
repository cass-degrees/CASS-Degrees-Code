//! Vue.js based means of adding/removing rules. Excludes serialization (see programmanagement.js)

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
    'course': "A rule which specifies that students should pick a certain amount of units from a set of available " +
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
