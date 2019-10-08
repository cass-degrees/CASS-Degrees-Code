Vue.component('rule_either_or', {
    props: {
        "details": {
            type: Object,
            validator(value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("either_or")) {
                    value.either_or = [[], []];
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
    data: function () {
        return {
            show_add_a_rule_modal: false,
            which_or: 0,
            add_a_rule_modal_option: 'course_list',

            // Show warnings if appropriate
            large_unit_count: false,
            inconsistent_units: false,

            component_groups: {'rules': EITHER_OR_COMPONENT_NAMES, 'requisites': REQUISITE_EITHER_OR_COMPONENT_NAMES, 'subplan': SUBPLAN_EITHER_OR_COMPONENT_NAMES},
            component_names: EITHER_OR_COMPONENT_NAMES,

            is_eitheror: true,
            "type": document.getElementById('page-title').innerText.split(' ')[1]
        }
    },
    methods: {
        add_or() {
            should_mark_newest_component = false;
            this.details.either_or.push([]);
            this.do_redraw();
        },
        add_rule() {
            should_mark_newest_component = true;
            this.show_add_a_rule_modal = false;
            // Add chosen rule to the right or group (based on the button clicked).
            this.details.either_or[this.which_or].push({
                type: this.add_a_rule_modal_option,
            });
        },
        remove(index, group) {
            should_mark_newest_component = false;
            this.details.either_or[group].splice(index, 1);
            this.update_units();
            this.do_redraw();
        },
        duplicate_rule(index, group) {
            should_mark_newest_component = true;
            // JSON.parse(JSON.stringify(...)) is done to actually duplicate the contents of the rule, rather than just copying the memory references.
            this.details.either_or[group].push(JSON.parse(JSON.stringify(this.details.either_or[group][index])));
            this.do_redraw();
        },
        remove_group(group) {
            should_mark_newest_component = false;
            this.details.either_or.splice(group, 1);
            this.update_units();
            this.do_redraw();
        },
        duplicate_group(group) {
            should_mark_newest_component = true;
            // JSON.parse(JSON.stringify(...)) is done to actually duplicate the contents of the rule, rather than just copying the memory references.
            this.details.either_or.splice(group, 0, JSON.parse(JSON.stringify(this.details.either_or[group])));
            this.do_redraw();
        },
        check_options(is_submission) {
            let valid = true;
            for (const child of this.$children) {
                valid = valid && child.check_options(is_submission);
            }

            // Count the number of units in each group, creating an error if there are any inconsistencies
            this.inconsistent_units = false;
            let units = null;
            for(const or_group of this.details.either_or){
                // Sum up the units of the or group
                const group_units = {"exact": 0, "max": 0, "min": 0};
                for (const details of or_group) {
                    const current_rule = this.find_rule(details);
                    if(current_rule) {
                        const child_units = current_rule.count_units();
                        for (const key in child_units) {
                            group_units[key] += child_units[key];
                        }
                    }
                    else break;
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
                    const min = Math.max(units.exact + units.min, group_units.exact + group_units.min);
                    let max;
                    if (units.exact + units.min + units.max > group_units.exact + group_units.min + group_units.max)
                        max = group_units.exact + group_units.min + group_units.max - min;
                    else
                        max = units.exact + units.min + units.max - min;
                    units = {'exactly': 0, 'min': min, 'max': max };

                }
            }

            return valid;
        },
        count_units() {
            // Get the unit count of the entire OR rule as the unit count of the first group
            const units = {"exact": 0, "max": 0, "min": 0};
            if (this.details.either_or.length !== 0){
                for (const details of this.details.either_or[0]) {
                    const child_units = this.find_rule(details).count_units();
                    for (const key in child_units) {
                        units[key] += child_units[key];
                    }
                }
            }

            return units;
        },

        find_rule(rule_details) {
            // Takes a rule details object and finds the child node with a matching set of rules
            for (const child of this.$children) {
                if (child.details === rule_details) {
                    return child;
                }
            }

            return null;
        },
        update_units() {
            // "check_options" is run as an updated unit count affects the error messages in this rule
            this.check_options();

            // Will go through each rule and determine how many units it specifies, showing a warning if over 48
            for (const or_group of this.details.either_or) {
                const group_units = {"exact": 0, "max": 0, "min": 0};
                for (const details of or_group){
                    const current_rule = this.find_rule(details);
                    if(current_rule) {
                        const child_units = current_rule.count_units();
                        for (const key in child_units) {
                            group_units[key] += child_units[key];
                        }
                    }
                    else break;
                }

                if (group_units.exact + group_units.min > 48) {
                    this.large_unit_count = true;
                    return;
                }
            }
            this.large_unit_count = false;
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw() {
            this.refresh.push("");
        },
        set_id(group, id) {
            // Used for tracking where elements are dropped outside of Vue
            id_map[this._uid] = this;
            if (id == null)
                return this._uid + "_" + group;
            else
                return this._uid + "_" + group + "_" + id;
        }
    },
    template: '#eitherOrTemplate'
});
