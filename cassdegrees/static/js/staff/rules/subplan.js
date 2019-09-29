Vue.component('rule_subplan', {
    props: {
        "details": {
            type: Object,

            validator(value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("ids")) {
                    value.ids = [];
                }

                // optional description field for staff reference
                if (!value.hasOwnProperty("list_description")) {
                    value.list_description = "";
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
    data() {
        return {
            "subplans": [],
            "active_filter": "",                // local data used to monitor value of subplan_type for dynamic label
            "filtered_subplans": [],
            "program_year": "",
            "subplan_types": [],
            "info_msg": INFO_MSGS['subplan'],
            "optionsProxy": [],                  // required prop, default behaviour to display selection tags
            "selected_subplans": [],             // used to store the code and name version of the course when selected
            "showLoadingSpinner": false,
            "subplan_type_label": "",
            "student_description_label": "",
            "show_help": false,

            // Display related warnings if true
            "non_unique_options": false,
            "inconsistent_units": false,
            "wrong_year_selected": false,
            "is_blank": false,

            "redraw": false
        }
    },
    created() {
        // Javascript has the best indirection...
        const rule = this;
        const request = new XMLHttpRequest();
        this.selected_subplans = []
        rule.subplan_types = SUBPLAN_TYPES;

        request.addEventListener("load", function () {
            rule.subplans = JSON.parse(request.response);

            // if there are already plans selected on load, load their details from subplans to selected_subplans
            if (rule.details.ids.length > 0) {
                for (let i = 0; i < rule.details.ids.length; i++) {
                    let existingID = rule.details.ids[i];
                    for (let x = 0; x < rule.subplans.length; x++) {
                        if (existingID === rule.subplans[x].id) {
                            rule.selected_subplans.push(rule.subplans[x])
                            break;
                        }
                    }
                }
            }

            rule.check_options(false);
            rule.apply_subplan_filter();
        });
        request.open("GET", "/api/search/?select=id,code,name,units,year,publish,planType&from=subplan&publish=true");
        request.send();

        // Sets the program year to be the value of the id_year field in the original component
        rule.program_year = document.getElementById('id_year').value;
        // Modifies the original 'id_year' element by telling it to refresh all components on all keystrokes
        document.getElementById('id_year').addEventListener("input", function () {
            app.redraw();
        });

        // Keep a copy of the OR Rule's "update_units" function (Or a blank function if unavailable)
        this.parent_update_units_fn = this.$parent.get_or_rule_update_units_fn();

        // Check on load whether a filter already exists
        if (rule.details.subplan_type !== "") {
            this.active_filter = this.details.subplan_type;
        }

        this.updateSubplanTypeLabel()
        this.updateStudentDescriptionLabel()
    },

    mounted: function() {

    },

    computed: {
        // generates the appropriate placeholder text for the tool depending on list or course mode
        placeholderText() {
            year = this.program_year
            if (this.active_filter === "MIN") {
                return "Search minors for " + year + ", press esc or tab to close"
            } else if (this.active_filter === "MAJ") {
                return "Search majors for " + year + ", press esc or tab to close"
            } else if (this.active_filter === "SPEC") {
                return "Search specialisations for " + year + ", press esc or tab to close"
            } else {
                return "Select a subplan type above to proceed."
            }
        },

        // used to compute appropriate ordering for template ul element
        sortedSelectedList() {
            return this.selected_subplans.sort((a, b) => (a.code > b.code) ? 1 : -1)
        },

        // used to compute appropriate ordering for dropdown list
        sortedSubplanList() {
            return this.filtered_subplans.sort((a, b) => (a.code > b.code) ? 1 : -1)
        },

    },

    // subcomponent of the selector must be declared and included in rulescripts.html
    components: {
        Multiselect: window.VueMultiselect.default
    },

    methods: {
// Returns label for multiselect drop down, label for dynamic list beneath generated separately
        customLabel(option) {
            return `${option.code} - ${option.name} ${option.year}`;
        },

        // Update an array of selected values and remove the selected item from the list of available options
        // Will distinguish between adding an existing list and adding a course
        updateSelected(value) {
            value.forEach((resource) => {
                // Adds selected resources to array and prevents duplicates
                if (!this.details.ids.some(id => id === resource.id)) {
                    this.selected_subplans.push(resource);
                    this.details.ids.push(resource.id);
                }
                // remove the selected course from the list of available courses to add
                let resourceID = this.filtered_subplans.indexOf(resource);
                this.filtered_subplans.splice(resourceID, 1);
            });

            // Clear options proxy to avoid selection tags from being displayed
            this.check_options(false);
            this.optionsProxy = [];
        },

        // remove the item from the display list and the elements field when x is clicked
        // index is the index from the selected_courses array
        // remove code details.codes
        remove_subplan(index) {
            this.selected_subplans.splice(index, 1).forEach((subplan) => {
                // add deleted subplans back to options
                this.filtered_subplans.push(subplan);
                this.sortSubplanOptions();

                // find and remove code from details.ids
                for (let i = 0; i < this.details.ids.length; i++) {
                    if (subplan.id === this.details.ids[i]) {
                        this.details.ids.splice(i, 1);
                        break;
                    }
                }
            });

            this.check_options(false);
            this.do_redraw();
        },

        apply_subplan_filter() {
            // Create a new array containing the filtered items for vue to read off
            const rule = this;

            if (rule.program_year && rule.details.subplan_type) {
                rule.filtered_subplans = rule.subplans.filter(
                    function (item) {
                        return item.planType === rule.details.subplan_type && parseInt(rule.program_year) === item.year;
                    }
                );
                // If there are already selected plans when the filter is applied, remove subplans from list
                if (rule.selected_subplans.length > 0) {
                    rule.selected_subplans.forEach(element => {
                        for (let i = 0; i < rule.filtered_subplans.length; i++) {
                            if (element.id === rule.filtered_subplans[i].id) {
                                rule.filtered_subplans.splice(i, 1);
                                break;
                            }
                        }
                    })
                }
            } else {
                rule.filtered_subplans = [];
            }
            this.do_redraw();
        },

        change_filter() {
            // Clear the current list and re-apply the filter
            this.active_filter = this.details.subplan_type;
            this.updateSubplanTypeLabel();
            // reset selected ids
            this.details.ids = [];
            this.selected_subplans = [];
            this.apply_subplan_filter();
            this.update_units();
            this.do_redraw();
        },

        check_options(is_submission) {
            // Ensure all data has been filled in if final submission
            // options are blank if kind is blank or details.ids.length < 1
            // only display error if the user has attempted to submit the form
            if (is_submission) {
                this.is_blank = this.details.kind === "" || this.details.ids.length < 1;
            } else {
                // remove error if user corrects prior to submission
                if (this.details.kind !== "" && this.details.ids.length > 0) {
                    this.is_blank = false;
                }
            }

            // Check if invalid subplan year
            this.wrong_year_selected = false;
            year_check:
                for (const selected_index in this.details.ids) {
                    selected_value = this.details.ids[selected_index];
                    for (const element_index in this.subplans) {
                        const element_value = this.subplans[element_index];
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
            let found = [];

            for (const index in this.details.ids) {
                const value = this.details.ids[index];
                if (found.includes(value)) {
                    this.non_unique_options = true;
                    break;
                }
                found.push(value);
            }

            // Check for inconsistent units
            this.inconsistent_units = false;
            let desired_unit_value = 0;

            for (const index in this.details.ids) {
                const value = this.details.ids[index];
                // Find the raw data for this ID
                for (const element_index in this.subplans) {
                    const element_value = this.subplans[element_index];
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
            return !this.wrong_year_selected && !this.non_unique_options && !this.inconsistent_units && !this.is_blank;
        },

        // force sort of multiselect options list on refresh
        sortSubplanOptions() {
            this.filtered_subplans = this.sortedSubplanList
        },

        // force sort of the selected options used to display the ul component
        sortSelectedList() {
            this.selected_subplans = this.sortedSelectedList
        },

        count_units() {
            const units = SUBPLAN_UNITS[this.details.subplan_type];
            if (units)
                return {"exact": units, "max": 0, "min": 0};
            else
                return {"exact":  0, "max": 0, "min": 0};
        },

        update_units() {
            // To be called whenever the unit count is updated. Will ask the OR rule to re-evaluate the unit count
            this.parent_update_units_fn();
            this.check_options(false);
        },

        updateStudentDescriptionLabel() {
            this.student_description_label = this.details.kind
            this.parent_update_units_fn();
            this.check_options();
        },

        updateSubplanTypeLabel() {
            if (this.details.subplan_type !== "") {
                this.subplan_type_label = this.subplan_types[this.active_filter].toLowerCase()
            }
        },

        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function () {
            this.program_year = document.getElementById('id_year').value;
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#subplanRuleMultiselectTemplate'
});
