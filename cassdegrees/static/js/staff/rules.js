//! Vue.js based means of adding/removing rules. Excludes serialization (see programmanagement.js)

// Stores a JSON of all rule names, for internal reference only.
const ALL_COMPONENT_NAMES = {
    'incompatibility': "Incompatibility",
    'program': 'Program',
    'subplan': "Subplan",
    'course': "Course",
    'course_requisite': "Course",
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
    'course': "Course",
    'custom_text': "Custom (Text)",
    'elective': "Elective",
    'either_or': "Either Or"
};

// For either rule, list everything in the drop down menu except the "Either" option, or recursion will occur.
const EITHER_OR_COMPONENT_NAMES = {
    'subplan': "Subplan",
    'course': "Course",
    'custom_text': "Custom (Text)",
    'elective': "Elective"
};

//
const REQUISITE_COMPONENT_NAMES = {
    'incompatibility': "Incompatibility",
    'program': 'Program',
    'elective': "Elective",
    'course_requisite': "Course",
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
    'min': 'At least',
    'exact': 'Exactly',
    'max': 'No more than'
};

const SUBPLAN_TYPES = {
    'MAJ':  'Majors',
    'MIN':  'Minors',
    'SPEC': 'Specialisations'
};

const INFO_MSGS = {
    'course': '<p>This Requisite requires Courses in the system. Please create Courses ' +
        '<a href="/staff/create/course/" target="_blank">here</a> or bulk upload Courses ' +
        '<a href="/staff/bulk_upload/" target="_blank">here</a> first before creating this Requisite.</p>',
    'subplan': '<p>This Requisite requires Subplans in the system. Please create Subplans ' +
        '<a href="/staff/create/subplan/" target="_blank">here</a> first before creating this Requisite.</p>',
    'program': '<p>This Requisite requires Programs in the system. Please create Programs ' +
        '<a href="/staff/create/program/" target="_blank">here</a> first before creating this Requisite.</p>'
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
            "info_msg": INFO_MSGS['course'],

            // Display related warnings if true
            "non_unique_options": false,
            "is_blank": false,

            "redraw": false
        }
    },
    created: function() {
        // Javascript has the best indirection...
        var rule = this;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function() {
            rule.courses = JSON.parse(request.response);
            rule.courses.sort(
                function(a, b){
                    return a['code'].localeCompare(b['code'])
                }
            );

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

            // Ensure all data has been filled in
            this.is_blank = false;
            for (var index in this.details.incompatible_courses) {
                var value = this.details.incompatible_courses[index];
                if (value === -1 || value === "") {
                    this.is_blank = true;
                    break;
                }
            }

            return !this.non_unique_options && !this.is_blank;
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
            "info_msg": INFO_MSGS['program'],

            // Display related warnings if true
            "is_blank": false,

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
        request.open("GET", "/api/search/?select=code,name&from=program");
        request.send();
    },
    methods: {
        check_options: function() {
            // Ensure all data has been filled in
            this.is_blank = this.details.program === "";

            return !this.is_blank;
        },
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

                if (!value.hasOwnProperty("subplan_type")) {
                    value.subplan_type = "";
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "subplans": [],
            "filtered_subplans": [],
            "program_year": "",
            "subplan_types": [],
            "info_msg": INFO_MSGS['subplan'],

            // Display related warnings if true
            "non_unique_options": false,
            "inconsistent_units": false,
            "wrong_year_selected": false,
            "is_blank": false,

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
            rule.apply_subplan_filter();
        });
        request.open("GET", "/api/search/?select=id,code,name,units,year,publish,planType&from=subplan&publish=true");
        request.send();

        rule.subplan_types = SUBPLAN_TYPES;

        // Sets the program year to be the value of the id_year field in the original component
        rule.program_year = document.getElementById('id_year').value;
        // Modifies the original 'id_year' element by telling it to refresh all components on all keystrokes
        document.getElementById('id_year').setAttribute("oninput", "redrawVueComponents()");
    },
    methods: {
        apply_subplan_filter: function(){
            // Create a new array containing the filtered items for vue to read off
            var rule = this;

            if(rule.program_year && rule.details.subplan_type) {
                rule.filtered_subplans = rule.subplans.filter(
                    function (item) {
                        return item.planType === rule.details.subplan_type && parseInt(rule.program_year) === item.year;
                    }
                );
            }
            else
                rule.filtered_subplans = [];
        },
        change_filter: function(){
            // Clear the current list and re-apply the filter
            for(var i in this.details.ids)
                this.details.ids[i] = -1;
            this.apply_subplan_filter();
            this.check_options();
            this.do_redraw();
        },
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
            // Ensure all data has been filled in
            this.is_blank = this.details.kind === "";
            for (var index in this.details.ids) {
                var value = this.details.ids[index];
                if (value === -1 || value === "") {
                    this.is_blank = true;
                    break;
                }
            }

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

            return !this.wrong_year_selected && !this.non_unique_options && !this.inconsistent_units &&  !this.is_blank;
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

                if (!value.hasOwnProperty("list_type")) {
                    // possible values = LIST_TYPES
                    value.list_type = "";
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "courses": [],
            "list_types": [],
            "info_msg": INFO_MSGS['course'],

            // Display related warnings if true
            "non_unique_options": false,

            "invalid_units": false,
            "invalid_units_step": false,
            "is_blank": false,

            "redraw": false
        }
    },
    created: function() {
        // Javascript has the best indirection...
        var rule = this;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function() {
            rule.courses = JSON.parse(request.response);
            rule.courses.sort(
                function(a, b){
                    return a['code'].localeCompare(b['code'])
                }
            );

            rule.list_types = LIST_TYPES;
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
            // Ensure all data has been filled in
            this.is_blank = this.details.unit_count == null;
            for (var index in this.details.codes) {
                var value = this.details.codes[index];
                if (value === -1 || value === "") {
                    this.is_blank = true;
                    break;
                }
            }
            this.is_blank = this.is_blank || this.details.list_type === "";

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

            return !this.non_unique_options && !this.invalid_units && !this.invalid_units_step && !this.is_blank;
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
            "info_msg": INFO_MSGS['course'],

            // Display related warnings if true
            "non_unique_options": false,
            "is_blank": false,
            "redraw": false
        }
    },
    created: function() {
        // Javascript has the best indirection...
        var rule = this;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function() {
            rule.courses = JSON.parse(request.response);
            rule.courses.sort(
                function(a, b){
                    return a['code'].localeCompare(b['code'])
                }
            );
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
            // Ensure all data has been filled in
            this.is_blank = false;
            for (var index in this.details.codes) {
                var value = this.details.codes[index];
                if (value === -1 || value === "") {
                    this.is_blank = true;
                    break;
                }
            }

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

            return !this.non_unique_options && !this.is_blank;
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

Vue.component('rule_elective', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("unit_count")) {
                    value.unit_count = 0;
                }

                if (!value.hasOwnProperty("subject_area")) {
                    value.subject_area = "all";
                }

                if (!value.hasOwnProperty("year_level")) {
                    value.year_level = "all";
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "number_of_year_levels": 9,
            "subject_areas": [],
            "info_msg": INFO_MSGS['course'],

            // Display related warnings if true
            "invalid_units": false,
            "invalid_units_step": false,
            "is_blank": false,
          
            "redraw": false
        }
    },
    created: function() {
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
            rule.subject_areas.sort(
                function(a, b){
                    return a.localeCompare(b)
                }
            );
            rule.check_options();
        });
        request.open("GET", "/api/search/?select=code&from=course");
        request.send();
    },
    methods: {
        check_options: function() {
            // Ensure all data has been filled in
            this.is_blank = this.details.unit_count === "";

            // Ensure Unit Count is valid:
            if (this.details.unit_count !== "") {
                this.invalid_units = this.details.unit_count < 0;
                this.invalid_units_step = this.details.unit_count % 6 !== 0;
            }
            else{
                this.invalid_units = false;
                this.invalid_units_step = false;
            }

            return !this.invalid_units && !this.invalid_units_step && !this.is_blank;
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#electiveRuleTemplate'
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
            "not_divisible": false,
            "is_blank": false
        }
    },
    created: function() {
        this.check_options();
    },
    methods: {
        check_options: function() {
            this.is_blank = this.details.text === "";

            this.not_divisible = this.details.units % 6 !== 0;

            return !this.not_divisible && !this.is_blank;
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
            "is_blank": false
        }
    },
    created: function() {
        this.check_options();
    },
    methods: {
        check_options: function() {
            this.is_blank = this.details.text === "";

            return !this.is_blank;
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
        remove_group: function(group) {
            this.details.either_or.splice(group, 1);
            this.do_redraw();
        },
        check_options: function() {
            var valid = true;
            for (var index in this.$children){
                valid = valid && this.$children[index].check_options();
            }

            return valid;
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
            component_names: ALL_COMPONENT_NAMES,
            component_help: ALL_COMPONENT_HELP,
            show_help: false
        }
    },
    methods:{
        check_options: function() {
            var valid = true;
            for (var index in this.$children){
                valid = valid && this.$children[index].check_options();
            }

            return valid;
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
        check_options: function() {
            var valid = true;
            for (var index in this.$children){
                valid = valid && this.$children[index].check_options();
            }

            return valid;
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
    var valid = true;
    for (var index in app.$children){
        valid = valid && app.$children[index].check_options();
    }

    // Serialize list structures - this doesn't translate well over POST requests normally.
    document.getElementById("rules").value = JSON.stringify(app.rules);

    return valid;
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
