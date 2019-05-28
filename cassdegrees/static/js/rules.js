//! Vue.js based means of adding/removing rules. Excludes serialization (see programmanagement.js)

// Stores a JSON of all rule names, for internal reference only.
const ALL_COMPONENT_NAMES = {
    'incompatibility': "Incompatibility",
    'program': 'Program',
    'subplan': "Subplan",
    'year_level': 'Level-Specific Units',
    'subject_area': "Subject-Area Units",
    'course': "Course",
    'course_requisite': "Course",
    'custom_text': "Custom (Text)",
    'custom_text_req': "Custom (Text)",
    'either_or': "Either Or"
};

// Translation table between internal names for components and human readable ones.
const COMPONENT_NAMES = {
    'subplan': "Subplan",
    'year_level': 'Level-Specific Units',
    'subject_area': "Subject-Area Units",
    'course': "Course",
    'custom_text': "Custom (Text)",
    'either_or': "Either Or"
};

// For either rule, list everything in the drop down menu except the "Either" option, or recursion will occur.
const EITHER_OR_COMPONENT_NAMES = {
    'subplan': "Subplan",
    'year_level': 'Level-Specific Units',
    'subject_area': "Subject-Area Units",
    'course': "Course",
    'custom_text': "Custom (Text)"
};

//
const REQUISITE_COMPONENT_NAMES = {
    'incompatibility': "Incompatibility",
    'program': 'Program',
    'year_level': 'Level-Specific Units',
    'subject_area': "Subject-Area Units",
    'course_requisite': "Course",
    'custom_text_req': "Custom (Text)",
    'either_or': "Either Or"
};

const REQUISITE_EITHER_OR_COMPONENT_NAMES = {
    'program': 'Program',
    'year_level': 'Level-Specific Units',
    'subject_area': "Subject-Area Units",
    'course_requisite': "Course",
    'custom_text_req': "Custom (Text)"
};

Vue.component('rule_incompatibility', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("incompatible_courses")) {
                    value.incompatible_courses = [""];
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "courses": [],

            // Display related warnings if true
            "non_unique_options": false,
            "inconsistent_units": false,

            "redraw": false
        }
    },
    created: function() {
        // Javascript has the best indirection...
        var rule = this;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function() {
            rule.courses = JSON.parse(request.response);

            rule.check_options();
        });
        request.open("GET", "/api/search/?select=code,name&from=course");
        request.send();
    },
    methods: {
        add_course: function() {
            // Mutable modification - redraw needed
            this.details.incompatible_courses.push(-1);
            this.check_options();
            this.do_redraw();
        },
        remove_course: function(index) {
            // Mutable modification - redraw needed
            this.details.incompatible_courses.splice(index, 1);
            this.check_options();
            this.do_redraw();
        },
        check_options: function() {
            // Check for duplicates
            this.non_unique_options = false;
            var found = [];

            for (var index in this.details.incompatible_courses) {
                var value = this.details.incompatible_courses[index];
                if (found.includes(value)) {
                    this.non_unique_options = true;
                    break;
                }
                found.push(value);
            }

            // Ensure Unit Count is valid:
            if (this.details.unit_count != null) {
                this.invalid_units = this.details.unit_count <= 0;
                this.invalid_units_step = this.details.unit_count % 6 !== 0;
            }
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#incompatibilityRuleTemplate'
});

Vue.component('rule_program', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("program")) {
                    value.program = "";
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "programs": [],

            // Display related warnings if true
            "non_unique_options": false,
            "inconsistent_units": false,

            "redraw": false
        }
    },
    created: function() {
        // Javascript has the best indirection...
        var rule = this;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function() {
            rule.programs = JSON.parse(request.response);

            rule.check_options();
        });
        request.open("GET", "/api/model/program/?format=json");
        request.send();
    },
    methods: {
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#programRuleTemplate'
});

Vue.component('rule_subplan', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("ids")) {
                    value.ids = [-1];
                }

                if (!value.hasOwnProperty("kind")) {
                    value.kind = "";
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "subplans": [],
            "program_year": "",

            // Display related warnings if true
            "non_unique_options": false,
            "inconsistent_units": false,
            "wrong_year_selected": false,

            "redraw": false
        }
    },
    created: function() {
        // Javascript has the best indirection...
        var rule = this;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function() {
            rule.subplans = JSON.parse(request.response);

            rule.check_options();
        });
        request.open("GET", "/api/search/?select=id,code,name,units,year,publish&from=subplan&publish=true");
        request.send();

        // Sets the program year to be the value of the id_year field in the original component
        rule.program_year = document.getElementById('id_year').value;
        // Modifies the original 'id_year' element by telling it to refresh all components on all keystrokes
        document.getElementById('id_year').setAttribute("oninput", "redrawVueComponents()");
    },
    methods: {
        add_subplan: function() {
            // Mutable modification - redraw needed
            this.details.ids.push(-1);
            this.check_options();
            this.do_redraw();
        },
        remove_subplan: function(index) {
            // Mutable modification - redraw needed
            this.details.ids.splice(index, 1);
            this.check_options();
            this.do_redraw();
        },
        check_options: function() {
            // Check if invalid subplan year
            this.wrong_year_selected = false;
            year_check:
            for (var selected_index in this.details.ids) {
                selected_value = this.details.ids[selected_index];
                for (var element_index in this.subplans) {
                    var element_value = this.subplans[element_index];
                    if (element_value.id == selected_value) {
                        if ("" + element_value['year'] != this.program_year) {
                            this.wrong_year_selected = true;
                            break year_check;
                        }
                    }
                }
            }

            // Check for duplicates
            this.non_unique_options = false;
            var found = [];

            for (var index in this.details.ids) {
                var value = this.details.ids[index];
                if (found.includes(value)) {
                    this.non_unique_options = true;
                    break;
                }
                found.push(value);
            }

            // Check for inconsistent units
            this.inconsistent_units = false;
            var desired_unit_value = 0;

            for (var index in this.details.ids) {
                var value = this.details.ids[index];
                // Find the raw data for this ID
                for (var element_index in this.subplans) {
                    var element_value = this.subplans[element_index];
                    if (element_value.id === value) {
                        if (desired_unit_value === 0) {
                            desired_unit_value = element_value.units;
                        } else if (desired_unit_value !== element_value.units) {
                            this.inconsistent_units = true;
                        }

                        break;
                    }
                }
            }
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.program_year = document.getElementById('id_year').value;
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#subplanRuleTemplate'
});

Vue.component('rule_course', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("codes")) {
                    value.codes = [""];
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "courses": [],

            // Display related warnings if true
            "non_unique_options": false,

            "invalid_units": false,
            "invalid_units_step": false,

            "redraw": false
        }
    },
    created: function() {
        // Javascript has the best indirection...
        var rule = this;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function() {
            rule.courses = JSON.parse(request.response);

            rule.check_options();
        });
        request.open("GET", "/api/search/?select=code,name&from=course");
        request.send();
    },
    methods: {
        add_course: function() {
            // Mutable modification - redraw needed
            this.details.codes.push(-1);
            this.check_options();
            this.do_redraw();
        },
        remove_course: function(index) {
            // Mutable modification - redraw needed
            this.details.codes.splice(index, 1);
            this.check_options();
            this.do_redraw();
        },
        check_options: function() {
            // Check for duplicates
            this.non_unique_options = false;
            var found = [];

            for (var index in this.details.codes) {
                var value = this.details.codes[index];
                if (found.includes(value)) {
                    this.non_unique_options = true;
                    break;
                }
                found.push(value);
            }

            // Ensure Unit Count is valid:
            if (this.details.unit_count != null) {
                this.invalid_units = this.details.unit_count <= 0;
                this.invalid_units_step = this.details.unit_count % 6 !== 0;
            }
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#courseRequirementTemplate'
});

Vue.component('rule_course_requisite', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("codes")) {
                    value.codes = [""];
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "courses": [],

            // Display related warnings if true
            "non_unique_options": false,

            "redraw": false
        }
    },
    created: function() {
        // Javascript has the best indirection...
        var rule = this;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function() {
            rule.courses = JSON.parse(request.response);

            rule.check_options();
        });
        request.open("GET", "/api/search/?select=code,name&from=course");
        request.send();
    },
    methods: {
        add_course: function() {
            // Mutable modification - redraw needed
            this.details.codes.push(-1);
            this.check_options();
            this.do_redraw();
        },
        remove_course: function(index) {
            // Mutable modification - redraw needed
            this.details.codes.splice(index, 1);
            this.check_options();
            this.do_redraw();
        },
        check_options: function() {
            // Check for duplicates
            this.non_unique_options = false;
            var found = [];

            for (var index in this.details.codes) {
                var value = this.details.codes[index];
                if (found.includes(value)) {
                    this.non_unique_options = true;
                    break;
                }
                found.push(value);
            }
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#courseRequisiteTemplate'
});

Vue.component('rule_subject_area', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("subject")) {
                    value.subject = "";
                }

                if (!value.hasOwnProperty("year_level")) {
                    value.year_level = null;
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "number_of_year_levels": 9,
            "subject_areas": [],

            // Display related warnings if true
            "invalid_units": false,
            "invalid_units_step": false,
          
            "redraw": false
        }
    },
    created: function() {
        // Javascript has the best indirection...
        var rule = this;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function() {
            rule.subject_areas = JSON.parse(request.response);
            var subject_areas = [];
            for (var index in rule.subject_areas) {
                let subject_area = rule.subject_areas[index]["code"].slice(0,4);
                // creates a unique list of subject_areas
                if (subject_areas.indexOf(subject_area) === -1) subject_areas.push(subject_area);
            }
            rule.subject_areas = subject_areas;
            rule.check_options();
        });
        request.open("GET", "/api/search/?select=code&from=course");
        request.send();
    },
    methods: {
        check_options: function() {
            // Ensure Unit Count is valid:
            if (this.details.unit_count != null) {
                this.invalid_units = this.details.unit_count <= 0;
                this.invalid_units_step = this.details.unit_count % 6 !== 0;
            }
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#subjectAreaRuleTemplate'
});

Vue.component('rule_year_level', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("year_level")) {
                    value.year_level = null;
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "number_of_year_levels": 9,

            // Display related warnings if true
            "invalid_units": false,
            "invalid_units_step": false,
            "invalid_course_year_level": false,

            "redraw": false
        }
    },
    methods: {
        check_options: function() {
            // Ensure Unit Count is valid:
            if (this.details.unit_count != null) {
                this.invalid_units = this.details.unit_count <= 0;
                this.invalid_units_step = this.details.unit_count % 6 !== 0;
            }
            // Ensure Course Year Level Input is valid
            if (this.details.year_level != null) {
                this.invalid_course_year_level = this.details.year_level % 1000 !== 0;
            }
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#yearSpecificRuleTemplate'
});

Vue.component('rule_custom_text', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("text")) {
                    value.text = "";
                }

                if (!value.hasOwnProperty("units")) {
                    value.units = 0;
                }

                if (!value.hasOwnProperty("show_course_boxes")) {
                    value.show_course_boxes = false;
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "not_divisible": false
        }
    },
    methods: {
        check_options: function() {
            this.not_divisible = this.details.units % 6 !== 0;
        }
    },
    template: '#customTextRuleTemplate'
});

Vue.component('rule_custom_text_req', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("text")) {
                    value.text = "";
                }

                return true;
            }
        }
    },
    data: function() {
        return {
        }
    },
    methods: {
        check_options: function() {
        }
    },
    template: '#customTextReqRuleTemplate'
});

Vue.component('rule_either_or', {
    props: {
        "details": {
            type: Object,
            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("either_or")) {
                    value.either_or = [];
                }

                return true;
            }
        },
        // Message inserted between rules
        "separator": {
            type: String,
            default: ""
        }
    },
    data: function() {
        return {
            show_add_a_rule_modal: false,
            which_or: 0,
            add_a_rule_modal_option: 'course',

            component_groups: { 'rules': EITHER_OR_COMPONENT_NAMES, 'requisites': REQUISITE_EITHER_OR_COMPONENT_NAMES},
            component_names: EITHER_OR_COMPONENT_NAMES,

            // Forces the element to re-render, if mutable events occurred
            redraw: false
        }
    },
    methods: {
        add_or: function() {
            this.details.either_or.push([]);
            this.do_redraw();
        },
        add_rule: function() {
            this.show_add_a_rule_modal = false;
            // Add chosen rule to the right or group (based on the button clicked).
            this.details.either_or[this.which_or].push({
                type: this.add_a_rule_modal_option,
            });
            this.do_redraw();
        },
        remove: function(index, group) {
            this.details.either_or[group].splice(index, 1);
            this.do_redraw();
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#eitherOrTemplate'
});

// Handler for different Vue components, redirecting to the right component
Vue.component('rule', {
    props: {
        "details": {
            type: Object
        }
    },
    data: function() {
        return {
            component_names: ALL_COMPONENT_NAMES
        }
    },
    template: '#ruleTemplate'
});

// Contains a set of rules, with a button to add more
Vue.component('rule_container', {
    props: {
        "rules": {
            type: Array
        },
        // Message inserted between rules
        "separator": {
            type: String,
            default: ""
        }
    },
    data: function() {
        return {
            show_add_a_rule_modal: false,
            add_a_rule_modal_option: 'course',

            component_groups: { 'rules': COMPONENT_NAMES, 'requisites': REQUISITE_COMPONENT_NAMES},
            component_names: null,

            // Forces the element to re-render, if mutable events occurred
            redraw: false
        }
    },
    methods: {
        add_rule: function() {
            this.show_add_a_rule_modal = false;
            this.rules.push({
                type: this.add_a_rule_modal_option,
            });
            this.do_redraw();
        },
        remove: function(index) {
            this.rules.splice(index, 1);
            this.do_redraw();
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#ruleContainerTemplate'
});

/**
 * Submits the rules form.
 */
function handleRules() {
    // Serialize list structures - this doesn't translate well over POST requests normally.
    document.getElementById("rules").value = JSON.stringify(app.rules);

    return true;
}

var app = new Vue({
    el: '#rulesContainer',
    data: {
        rules: []
    }
});

var reqs = document.getElementById("rules").value.trim();
if (reqs.length > 0) {
    var parsed = JSON.parse(reqs);
    if (parsed != null) {
        app.rules = parsed;
    }
}


function redrawVueComponents() {
    for (var index in app.$children){
        app.$children[index].do_redraw();
    }
}
