//! Basic utilities to handle serialization and deserialization of custom types (global requirements, rules)
//! which don't fit neatly into the regular HTML form list syntax.

// Incrementing pointer for global requirements. Must be unique.
var count = 0;

// Terminology:
// (Global requirement) container: The entire fieldset + container for a singular global requirement.
// (Global requirement) inner container: Dynamic field inside a container containing options depending
//                                       on what rule type was selected.

/**
 * Finds the ID for the current container.
 *
 * @param element The element that was clicked. Search for the ID will occur automatically.
 * @returns string A parent ID, or null if one doesn't exist.
 */
function searchForID(element) {
    // Search ended without any results.
    if (element == null) {
        return null;
    }

    if (element.id === undefined || element.id == null || element.id === "") {
        return searchForID(element.parentElement);
    }

    return element.id;
}

/**
 * Creates a new global requirement.
 *
 * @returns string The ID of the newly created element.
 */
function addGlobalReq() {
    var newElement = document.getElementById("globalReqsTemplate").cloneNode(true);

    // Make this element unique and visible
    newElement.style.display = "block";
    newElement.id = "globalRequirement" + (count++);

    // Update inner containers with new IDs.
    // Query selector used as getElement is not available in this pseudo-element state.
    newElement.querySelector('#globalReqsInnerPlaceholder').id = newElement.id + "Inner";
    newElement.querySelector('#globalReqsTypePlaceholder').id = newElement.id + "Type";

    document.getElementById("globalRequirementsContainer").appendChild(newElement);

    return newElement.id;
}

/**
 * Removes the referenced global requirement.
 *
 * @param element DOM object representing an element within the container to delete.
 */
function removeGlobalReq(element) {
    document.getElementById(searchForID(element)).remove();
}

/**
 * Switches between different option boxes in the inner container depending on the global requirement chosen.
 *
 * @param element The element that was clicked. Search for the ID will occur automatically.
 */
function onGlobalReqsTypeChanged(element) {
    // Find the inner container to operate on
    // Evidently, the element that was just clicked is *not* going to be the container
    var containerID = searchForID(element.parentElement);
    // Query selector used as getElement cannot be chained well.
    var innerContainer = document.querySelector("#" + containerID + " #" + containerID + "Inner");

    // Remove anything that is already there
    // https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
    while (innerContainer.firstChild) {
        innerContainer.removeChild(innerContainer.firstChild);
    }

    switch(element.value) {
        // Allows for other types of global requirements with this switch statement.
        case "min":
        case "max":
            var innerContainerContents = document.getElementById("minMaxUnitsTemplate").cloneNode(true);

            innerContainerContents.id = containerID + "InnerContents";
            innerContainerContents.style.display = "block";

            innerContainer.appendChild(innerContainerContents);
            break;
        default:

    }
}

/**
 * Converts a global requirement into a singular blob for submission.
 *
 * @param element The global requirement container to serialize.
 */
function serializeGlobalReq(element) {
    var containerID = searchForID(element);

    // Get the type firstly:
    var output = {
        'type': document.getElementById(containerID + "Type").value
    };

    // For every field in the inner container, submit that as well
    var inner_container = document.getElementById(containerID + "Inner");

    inner_container.querySelectorAll("input[name]").forEach(function (elem) {
        var value = undefined;

        // The web is... inconsistent
        if (elem.type === "checkbox") {
            value = elem.checked;
        } else {
            value = elem.value;
        }

        output[elem.name] = value;
    });

    return output;
}

/**
 * Converts global requirements into a singular blob for submission.
 */
function serializeGlobalReqs() {
    var globalReqs = [];

    for (var i = 0; i < count; i++) {
        var element = document.getElementById("globalRequirement" + i);
        if (element !== undefined && element != null) {
            globalReqs.push(serializeGlobalReq(element));
        }
    }

    return globalReqs;
}

/**
 * Deserializes incoming JSON for global requirements.
 *
 * @param json JSON input.
 */
function deserializeReqs(json) {
    // Reset to the beginning
    count = 0;
    var globalRequirements = document.getElementById("globalRequirementsContainer");
    while (globalRequirements.firstChild) {
        globalRequirements.removeChild(globalRequirements.firstChild);
    }

    json.forEach(function(requirement) {
        var containerID = addGlobalReq();
        var container = document.getElementById(containerID);

        // Deserialize type
        var containerType = document.getElementById(containerID + "Type");
        containerType.value = requirement.type;
        onGlobalReqsTypeChanged(containerType);

        // Deserialize all other data
        for (var key in requirement) {
            var targetElement = container.querySelector('input[name="' + key + '"]');
            if (targetElement !== undefined && targetElement != null) {
                if (targetElement.type === "checkbox") {
                    targetElement.checked = requirement[key];
                } else {
                    targetElement.value = requirement[key];
                }
            }
        }
    });
}


/**
 * Submits the program form.
 */
function submitProgram() {
    // Remove built-in error message - further validation might confuse the user.
    var serverError = document.getElementById("serverError");

    if (serverError !== undefined && serverError != null) {
        serverError.remove();
    }

    // Verify forms
    var mainFormPristine = new Pristine(document.getElementById("mainForm"), {
        errorTextClass: 'msg-error'
    }, false);
    var manuallySerializedPristine = new Pristine(document.getElementById("manualSerializedForm"), {
        errorTextClass: 'msg-error'
    }, false);

    if (!mainFormPristine.validate(null, false)) {
        console.log("Main form validation failed.");
        return;
    }

    if (!manuallySerializedPristine.validate(null, false)) {
        console.log("Manually serialized form validation failed.");
        return;
    }

    // Serialize list structures - this doesn't translate well over POST requests normally.
    document.getElementById("globalRequirements").value = JSON.stringify(serializeGlobalReqs());
    document.getElementById("mainForm").submit();
}
