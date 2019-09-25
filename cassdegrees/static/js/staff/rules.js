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
    'min': 'A Minimum Of',
    'exact': 'Exactly',
    'max': 'A Maximum Of'
};

const SUBPLAN_TYPES = {
    'MAJ':  'Majors',
    'MIN':  'Minors',
    'SPEC': 'Specialisations'
};

const SUBPLAN_UNITS = {
    'MAJ':  48,
    'MIN':  24,
    'SPEC': 24
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
            "show_help": false,

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

        // Keep a copy of the OR Rule's "update_units" function (Or a blank function if unavailable)
        this.parent_update_units_fn = this.$parent.get_or_rule_update_units_fn();
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
            this.update_units();
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
        count_units: function() {
            var units = SUBPLAN_UNITS[this.details.subplan_type];
            if (units)
                return {"exact": units, "max": 0, "min": 0};
            else
                return {"exact":  0, "max": 0, "min": 0};
        },
        update_units: function() {
            // To be called whenever the unit count is updated. Will ask the OR rule to re-evaluate the unit count
            this.parent_update_units_fn();
            this.check_options();
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
                    value.codes = [];
                }

                if (!value.hasOwnProperty("list_type")) {
                    // possible values = LIST_TYPES
                    value.list_type = "";
                }

                if (!value.hasOwnProperty("unit_count")) {
                    value.unit_count = "0";
                }

                return true;
            }
        },
    },

    // subcomponent of the selector must be declared and included in rulescripts.html
    components: {
        Multiselect: window.VueMultiselect.default
    },

    data: function() {
        return {
            "courses": [],          // used to store options for display - details.codes is used for database storage of selected course codes
            "list_types": [],
            "selected_courses": [], // used to store the code and name version of the course when selected
            "coursename_dict": {},  // used to store and find course names so background database not affected by selections
            "optionsProxy": [],     // required prop, default behaviour to display selection tags
            "lists": [],            // stores database lists for display if required
            "tempStore": [],        // holds course options when list selection is in use
            "showLoadingSpinner": false,
            "info_msg": INFO_MSGS['course'],

            // Display related warnings if true
            "non_unique_options": false,
            "invalid_units": false,
            "invalid_units_step": false,
            "is_blank": false,

            // Track whether adding list
            "is_list_search": false,

            "redraw": false
        }
    },
    created: function() {
        var rule = this;
        var request = new XMLHttpRequest();

        // add available courses
        request.addEventListener("load", function() {
            rule.courses = JSON.parse(request.response);
            rule.sortCourseOptions();

            // populate a name dictionary to reconcile selected codes with names without an additional API call
            rule.courses.forEach((courseObj) => {
                rule.coursename_dict[courseObj.code] = courseObj.name
            });

            rule.list_types = LIST_TYPES;
            rule.check_options();

            // if there are already selected courses in details.codes when the component is loaded load,
            // remove them from the options - must be done after courses response received
            if (!(rule.details.codes.length === 0)) {
                for (let i = 0; i < rule.details.codes.length; i++){
                    for (let x = 0; x < rule.courses.length; x++){
                        if (rule.courses[x].code === rule.details.codes[i]['code']) {
                            rule.courses.splice(x, 1).forEach(course => {
                                rule.selected_courses.push(course)
                            });
                            break;
                        }
                    }
                }
            }
        });

        request.open("GET", "/api/search/?select=code,name&from=course");
        request.send();


        // Keep a copy of the Or Rule's "update_units" function (Or a blank function if unavailable)
        this.parent_update_units_fn = this.$parent.get_or_rule_update_units_fn();
    },

    computed: {
        // generates the appropriate placeholder text for the tool depending on list or course mode
        placeholderText(){
            return this.is_list_search ? "Search lists..." : "Search courses, press esc or tab to close when done"
        },

        // used to compute appropriate ordering for template ul element
        sortedSelectedList(){
            return this.selected_courses.sort((a, b) => (a.code > b.code) ? 1 : -1)
        },

        // used to compute appropriate ordering for dropdown list
        sortedCourseList(){
            return this.courses.sort((a, b) => (a.code > b.code) ? 1 : -1)
        },

    },

    methods: {
        // Returns label for multiselect drop down, label for dynamic list beneath generated separately
        customLabel(option) {
            if (this.is_list_search) {
                return `${option.name} - ${option.year}`
            } else {
                return `${option.code} - ${option.name}`
            }
        },

        // force sort of multiselect options list on refresh
        sortCourseOptions(){
            this.courses = this.sortedCourseList
        },

        toggleListMode(){
            if (this.is_list_search) {
                this.is_list_search = false;
                this.courses = this.tempStore;
                this.tempStore = []
            } else {
                // track that the input has changed to list mode
                this.is_list_search = true;

                // preserve the list of course options
                this.tempStore = this.courses;

                // get available lists from database
                var rule = this;
                var request = new XMLHttpRequest();

                request.addEventListener("load", function () {
                    rule.lists = JSON.parse(request.response);
                    rule.lists.sort(
                        function (a, b) {
                            return a['name'].localeCompare(b['name'])
                        }
                    );
                    rule.courses = rule.lists
                });

                request.open("GET", "/api/search/?select=name,year,elements&from=list");
                request.send();
            }
        },

        // Update an array of selected values and remove the selected item from the list of available options
        // Will distinguish between adding an existing list and adding a course
        updateSelected(value) {
            if (this.is_list_search) {
                value.forEach((list) => {
                    list.elements.forEach((course) => {
                        // add course code to details.codes if not already present
                        if (!this.details.codes.some(code => code === course.code)) {
                            this.details.codes.push({'code': resource.code, 'name': resource.name})
                        }

                        // if a course is added through a list, remove it from the temporary store of courses
                        for (let i = 0; i < this.tempStore.length; i++) {
                            if (this.tempStore[i].code === course.code) {
                                this.tempStore.splice(i, 1).forEach(option => {
                                    this.selected_courses.push(option);
                                });
                                break;
                            }
                        }
                    })
                });

                // switch off list mode
                this.toggleListMode()

            } else {
                value.forEach((resource) => {
                    // Adds selected resources to array and prevents duplicates
                    if (!this.details.codes.some(code => code === resource.code)) {
                        this.selected_courses.push(resource)
                        this.details.codes.push({'code': resource.code, 'name': resource.name});
                    }
                    // remove the selected course from the list of available courses to add
                    let resourceID = this.courses.indexOf(resource)
                    this.courses.splice(resourceID, 1)
                });
            }

            // Clear options proxy to avoid selection tags from being displayed
            this.optionsProxy = []
        },

        // remove the item from the display list and the elements field when x is clicked
        // index is the index from the selected_courses array
        // remove code details.codes
        removeDependency(index) {
            this.selected_courses.splice(index, 1).forEach((course) => {
                // add deleted course back to options
                this.courses.push(course)
                this.sortCourseOptions()

                // find and remove code from details.codes
                for (let i = 0; i < this.details.codes.length; i++){
                    if (course.code === this.details.codes[i]['code']){
                        this.details.codes.splice(i, 1);
                        break;
                    }
                }
            });

            this.check_options();
            this.do_redraw();
        },

        check_options: function() {
            // Ensure all data has been filled in
            this.is_blank = this.details.unit_count == null;
            this.is_blank = this.details.codes.length === 0;
            this.is_blank = this.is_blank || this.details.list_type === "";

            // Duplicates are prevented by condition on updateSelected()

            // Ensure Unit Count is valid:
            if (this.details.unit_count != null) {
                this.invalid_units = this.details.unit_count <= 0;
                this.invalid_units_step = this.details.unit_count % 6 !== 0;
            }

            return !this.invalid_units && !this.invalid_units_step && !this.is_blank;
        },
        count_units: function() {
            switch(this.details.list_type){
                case "min":   return {"exact": 0, "max": 0, "min": parseInt(this.details.unit_count)};
                case "max":   return {"exact": 0, "max": parseInt(this.details.unit_count), "min": 0};
                case "exact": return {"exact": parseInt(this.details.unit_count), "max": 0, "min": 0};
                default: return {"exact": 0, "max": 0, "min": 0};
            }
        },
        update_units: function() {
            // To be called whenever the unit count is updated. Will ask the OR rule to re-evaluate the unit count
            this.parent_update_units_fn();
            this.check_options();
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#course-list-template'
});

// -------------------------------------------------------------------------------------------------------------------//

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

        // Keep a copy of the Or Rule's "update_units" function (Or a blank function if unavailable)
        this.parent_update_units_fn = this.$parent.get_or_rule_update_units_fn();
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
        count_units: function() {
            return {"exact": parseInt(this.details.unit_count), "max": 0, "min": 0};
        },
        update_units: function() {
            // To be called whenever the unit count is updated. Will ask the OR rule to re-evaluate the unit count
            this.parent_update_units_fn();
            this.check_options();
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

                if (!value.hasOwnProperty("unit_count")) {
                    value.unit_count = "0";
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
        // Keep a copy of the Or Rule's "update_units" function (Or a blank function if unavailable)
        this.parent_update_units_fn = this.$parent.get_or_rule_update_units_fn();
    },
    methods: {
        check_options: function() {
            this.is_blank = this.details.text === "";

            this.not_divisible = this.details.unit_count % 6 !== 0;

            return !this.not_divisible && !this.is_blank;
        },
        count_units: function() {
            return {"exact": parseInt(this.details.unit_count), "max": 0, "min": 0};
        },
        update_units: function() {
            // To be called whenever the unit count is updated. Will ask the OR rule to re-evaluate the unit count
            this.parent_update_units_fn();
            this.check_options();
        },
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
        },
        update_units: function() {
            // To be called whenever the unit count is updated. Will ask the OR rule to re-evaluate the unit count
            this.parent_update_units_fn();
            this.check_options();
        },
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
        },
        // Refresh is used to redraw the sub rules without nuking everything.
        // The prop is bound when the either_or is defined, and upon updating
        // a prop, the rules will be updated without deleting them first.
        "refresh": {
            type: Array,
        }
    },
    data: function() {
        return {
            show_add_a_rule_modal: false,
            which_or: 0,
            add_a_rule_modal_option: 'course',

            // Show warnings if appropriate
            large_unit_count: false,
            inconsistent_units: false,

            component_groups: { 'rules': EITHER_OR_COMPONENT_NAMES, 'requisites': REQUISITE_EITHER_OR_COMPONENT_NAMES},
            component_names: EITHER_OR_COMPONENT_NAMES,

            is_eitheror: true,
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
        },
        remove: function(index, group) {
            this.details.either_or[group].splice(index, 1);
            this.update_units();
            this.do_redraw();
        },
        duplicate_rule: function(index, group) {
            // JSON.parse(JSON.stringify(...)) is done to actually duplicate the contents of the rule, rather than just copying the memory references.
            this.details.either_or[group].push(JSON.parse(JSON.stringify(this.details.either_or[group][index])));
            this.do_redraw();
        },
        remove_group: function(group) {
            this.details.either_or.splice(group, 1);
            this.update_units();
            this.do_redraw();
        },
        duplicate_group: function(group) {
            // JSON.parse(JSON.stringify(...)) is done to actually duplicate the contents of the rule, rather than just copying the memory references.
            this.details.either_or.splice(group, 0, JSON.parse(JSON.stringify(this.details.either_or[group])));
            this.do_redraw();
        },
        check_options: function() {
            var valid = true;
            for (var child of this.$children){
                valid = valid && child.check_options();
            }

            // Count the number of units in each group, creating an error if there are any inconsistencies
            this.inconsistent_units = false;
            var units = null;
            for(var or_group of this.details.either_or){
                // Sum up the units of the or group
                var group_units = {"exact": 0, "max": 0, "min": 0};
                for (var details of or_group){
                    var child_units = this.find_rule(details).count_units();
                    for (var key in child_units)
                        group_units[key] += child_units[key]
                }

                // If units has not been set yet, set it to the current OR group
                if (units == null){
                    units = group_units;
                }
                // If units has been set, verify they are compatible and shrink the possible unit bounds
                else {
                    // If the current unit count is incompatible with the OR rule count, notify of inconsistent units
                    if (units.exact + units.min > group_units.exact + group_units.min + group_units.max){
                        this.inconsistent_units = true;
                        valid = false;
                    }
                    if (group_units.exact + group_units.min > units.exact + units.min + units.max){
                        this.inconsistent_units = true;
                        valid = false;
                    }

                    // Shrink the bounds of the OR rule units as much as possible
                    var min =  Math.max(units.exact + units.min, group_units.exact + group_units.min);
                    var max;
                    if (units.exact + units.min + units.max > group_units.exact + group_units.min + group_units.max)
                        max = group_units.exact + group_units.min + group_units.max - min;
                    else
                        max = units.exact + units.min + units.max - min;
                    units = {'exactly': 0, 'min': min, 'max': max };

                }
            }

            return valid;
        },
        count_units: function() {
            // Get the unit count of the entire OR rule as the unit count of the first group
            var units = {"exact": 0, "max": 0, "min": 0};
            if (this.details.either_or.length !== 0){
                for (var details of this.details.either_or[0]) {
                    var child_units = this.find_rule(details).count_units();
                    for (var key in child_units)
                        units[key] += child_units[key]
                }
            }

            return units;
        },
        find_rule: function(rule_details) {
            // Takes a rule details object and finds the child node with a matching set of rules
            for(var child of this.$children)
                if (child.details === rule_details)
                    return child;
            return null;
        },
        update_units: function() {
            // "check_options" is run as an updated unit count affects the error messages in this rule
            this.check_options();

            // Will go through each rule and determine how many units it specifies, showing a warning if over 48
            for(var or_group of this.details.either_or){
                var group_units = {"exact": 0, "max": 0, "min": 0};
                for (var details of or_group){
                    var child_units = this.find_rule(details).count_units();
                    for (var key in child_units)
                        group_units[key] += child_units[key]
                }

                if (group_units.exact + group_units.min > 48) {
                    this.large_unit_count = true;
                    return;
                }
            }
            this.large_unit_count = false;
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.refresh.push("");
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
            show_help: false,
            refresh: [],
        }
    },
    mounted: function() {
        var siblings = app.$children[0].$children;

        // Determine whether this rule is the most recent rule by finding which sibling
        // has the highest _uid assigned by Vue.
        var max = 0;
        var rule_creation_ranks = {};
        siblings.forEach(function(sib){
            if (!sib.$children[0].is_eitheror) {
                rule_creation_ranks[sib._uid] = sib;
                sib.$el.classList.remove("rule_active_visual");
                max = (sib._uid > max) ? sib._uid : max;
            }
            // Else we need to get the children of the either or rule
            else {
                // If nested or rules get implemented, this section may need to be made recursive
                var either_or_rules = sib.$children[0].$children;
                sib.$el.classList.remove("rule_active_visual");

                if (either_or_rules.length > 0) {
                    either_or_rules.forEach(function(rule) {
                        rule_creation_ranks[rule._uid] = rule;
                        rule.$el.classList.remove("rule_active_visual");
                        max = (rule._uid > max) ? rule._uid : max;
                    })
                }
                else {
                    rule_creation_ranks[sib._uid] = sib;
                    max = (sib._uid > max) ? sib._uid : max;
                }
            }
        });
        var recent_rule = rule_creation_ranks[max];

        // Add a visual cue and scroll to the most recent rule
        recent_rule.$el.classList.add("rule_active_visual");
        recent_rule.$el.scrollIntoView({behavior: "smooth"})
    },
    methods:{
        check_options: function() {
            var valid = true;
            for (var index in this.$children){
                valid = valid && this.$children[index].check_options();
            }

            return valid;
        },
        count_units: function() {
            var units = {"exact": 0, "max": 0, "min": 0};
            for (var child of this.$children){
                var child_units = child.count_units();
                for (var key in child_units)
                    units[key] += child_units[key];
            }
            return units;
        },
        get_or_rule_update_units_fn: function() {
            // Looks through the parent nodes until it finds the OR rule, returning its "count_units" function
            // If no OR rule is found, an empty function is returned
            var parent_or = this.$parent;
            while(parent_or !== undefined){
                if (parent_or.constructor.options.name === 'rule_either_or'){
                    return parent_or.update_units;
                }
                parent_or = parent_or.$parent;
            }
            return function() {};
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
            redraw: false,
        }
    },
    methods: {
        add_rule: function() {
            this.show_add_a_rule_modal = false;
            this.rules.push({
                type: this.add_a_rule_modal_option,
            });
        },
        remove: function(index) {
            this.rules.splice(index, 1);
        },
        duplicate_rule: function(index) {
            // JSON.parse(JSON.stringify(...)) is done to actually duplicate the contents of the rule, rather than just copying the memory references.
            this.rules.push(JSON.parse(JSON.stringify(this.rules[index])));
        },
        check_options: function() {
            var valid = true;
            for (var index in this.$children){
                valid = valid && this.$children[index].check_options();
            }

            return valid;
        },
        count_units: function() {
            var units = {"exact": 0, "max": 0, "min": 0};
            for (var child of this.$children){
                var child_units = child.count_units();
                for (var key in child_units)
                    units[key] += child_units[key];
            }
            return units;
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


function isValidUnitCount(value) {
    // Go through each child and sum up all of the units
    var units = {"exact": 0, "max": 0, "min": 0};
    for (var child of app.$children){
        var child_units = child.count_units();
        for (var key in child_units)
            units[key] += child_units[key];
    }

    // Return true if the specified value is within the unit count bounds
    return units.exact + units.min <= value && value <= units.exact + units.min + units.max;
}


function redrawVueComponents() {
    for (var index in app.$children){
        app.$children[index].do_redraw();
    }
}
