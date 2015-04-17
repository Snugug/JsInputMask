var PreDefinedMask = new (function() {
    return {
        SocialSecurityNumber: "999-99-9999",
        PhoneNumber: "(999) 999-9999",
        Date: "99/99/9999",
        DateTime: "99/99/9999 99:99:99",
        DateTimeNoSeconds: "99/99/9999 99:99",
        Time: "99:99:99",
        TimeNoSeconds: "99:99"
    }
});

var MaskMode = new (function() {
    return {
        Off: "Off",
        Numeric: "Numeric",
        Normal: "Normal"
    };
});

var InputMaskV2 = (function(options) {
    "use strict";

    var log = function(message) {
        if (!options || options.DebugMode) {
            console.log(message);
        }
    };
    
    var formatCharacters = ["-", "_", "(", ")", "[", "]", ":", ".", ",", "$", "%", "@", " ", "/"];

    var maskCharacters = ["A", "a", "9", "0", "*"];

    var mask = options.Mask.split("");

    var hasMask = mask.length > 0;

    var keys = {
        Num0: 48,
        Num9: 57,
        NumPad0: 96,
        NumPad9: 105,
        a: 65,
        c: 67,
        v: 86,
        x: 88,
        z: 90,
        asterisk: 42,
        backspace: 8,
        delete: 46,
        tab: 9,
        shift: 16,
        enter: 13,
        control: 17,
        escape: 27,
        home: 36,
        end: 35,
        left: 37,
        right: 39
    };

    var attributes = {
        ID: "id",
        ALREADY_BOUND: "data-alreadybound",
        MASK: "data-mask",
        UNMASK: "data-unmask",
        PLACEHOLDER: "placeholder",
        READ_ONLY: "readonly",
        PREVIOUS_VALUE: "data-previousvalue"
    };

    var getCursorPosition = (function (element) {
    	var position = 0;

    	if (document.selection) {
    		element.focus();

    		var selectRange = document.selection.createRange();

    		selectRange.moveStart("character", -element.value.length);

    		position = selectRange.text.length;
    	} else if (element.selectionStart || element.selectionStart === "0") {
    		position = element.selectionStart;
    	}

    	return position;
    });

    var setCursorPosition = (function (element, index) {
        if (element != null) {
            if (element.createTextRange) {
                var range = element.createTextRange();

                range.move("character", index);

                range.select();
            } else {
                if (element.selectionStart) {
                    element.focus();

                    element.setSelectionRange(index, index);
                } else {
                    element.focus();
                }
            }
        }
    });

    var removeCharacterAtIndex = (function (element, index) {
        log("removing character at index " + index);

        if (element.value.length > 0) {
            var value = element.value.slice(0, index) + element.value.slice(index + 1);

            element.value = value;

            if (element.value.length > 0) {
                setCursorPosition(element, index);
            } else {
                element.focus();
            }
        }
    });

    var insertCharacterAtIndex = (function (element, character, index) {
        log("inserting character " + character + " at index " + index);

        var newElementValue = element.value.slice(0, index) + character + element.value.slice(index);

        element.value = newElementValue;

        if (element.value.length > 0) {
            setCursorPosition(element, index + 1);
        } else {
            element.focus();
        }
    });

    var insertMaskCharacters = (function (element, index) {
        log("inserting mask characters");

        while (true) {
            var isMaskCharacter = formatCharacters.indexOf(mask[index]) > -1;

            var isMaskAlreadyThere = element.value.charAt(index) === mask[index];

            if (isMaskCharacter && !isMaskAlreadyThere) {
                log("inserting mask character: " + mask[index].charAt(0));

                insertCharacterAtIndex(element, mask[index], index);
            } else {
                break;
            }

            index += 1;
        }
    });

    var removeMaskCharacters = (function (element, index, keyCode) {
        log("removing mask characters");

        if (element.value.length > 0) {
            while (true) {
                var character = element.value.charAt(index);

                var isMaskCharacter = formatCharacters.indexOf(character) > -1;

                if (!isMaskCharacter || index === 0 || index === element.value.length) {
                    return;
                }

                removeCharacterAtIndex(element, index);

                if (keyCode === keys.backSpace) {
                    index -= 1;
                }

                if (keyCode === keys.delete) {
                    index += 1;
                }
            }
        }
    });

    var validateElement = (function (element) {
        var failed = false;

        if (element.value.length > 0) {
            if (element.value.length !== mask.length) {
                element.value = "";

                failed = true;
            } else {
                var value = element.value.split("");

                if (hasMask) {
                    for (var i = 0; i < element.value.length; i++) {
                        var elementCharacter = value.charAt(i);
                        var maskCharacter = mask[i];

                        if (maskCharacters.indexOf(maskCharacter) > -1) {
                            if (elementCharacter === maskCharacter || maskCharacter.charCodeAt(0) === keys.asterisk) {
                                continue;
                            } else {
                                element.value = "";

                                failed = true;;
                            }
                        } else {
                            if (maskCharacter.charCodeAt(0) === keys.a) {
                                if (elementCharacter.charCodeAt(0) <= keys.a || elementCharacter >= keys.z) {
                                    element.value = "";

                                    failed = true;;
                                }
                            } else if (maskCharacter.charCodeAt(0) === keys.Num9) {
                                if (elementCharacter.charCodeAt(0) <= keys.Num0 || elementCharacter >= keys.Num9) {
                                    element.value = "";

                                    failed = true;;
                                }
                            }
                        }
                    }
                } else {
                    if (options.MinLength) {
                        if (value < options.MinLength) {
                            element.value = "";
                        }
                    }

                    if (options.maxLength) {
                        if (value > options.maxLength) {
                            element.value = "";
                        }
                    }
                }
            }
        }

        if (failed && options.OnValidationFail) {
            options.OnValidationFail();
        }
    });

    var removeMaskCharactersFromString = (function(value) {
        if (value.match(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/ ]/gi)) {
            var newValue = value.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/ ]/gi, "");

            return newValue;
        } else {
            return value;
        }
    });

    var unMaskElement = (function (element) {
        log("unmasking");
        
        if (element.value != undefined && element.value.length > 0) {
            if (element.value.match(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/ ]/gi)) {
                var value = element.value;

                log("original value with mask: " + value);

                value = value.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/ ]/gi, "");

                element.value = value;

                log("new value without mask: " + value);
            } 
        }
    });

    var maskElement = (function (element) {
        log("masking");

        if (element.value != undefined && element.value.length > 0) {
            if (element.value.match(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/ ]/gi)) {
                unMaskElement(element);
            }

            var originalValue = element.value.split("");

            log("original value: " + originalValue);

            var originalElementIndex = 0;

            var newValue = "";

            for (var i = 0; i < mask.length; i++) {
                if (formatCharacters.indexOf(mask[i]) > -1) {
                    newValue += mask[i];
                } else {
                    newValue += originalValue[originalElementIndex++];
                }
            }

            element.value = newValue;

            log("new value: " + newValue);
        }
    });

    var characterRequest = (function (character, maskCharacter) {
        log("character request made for character " + String.fromCharCode(character) + " with mask character " + String.fromCharCode(maskCharacter));

        if (maskCharacter === keys.asterisk) {
			return true;
		} else if (maskCharacter === keys.Num0 || maskCharacter === keys.Num9) {
			var isNumber = character >= keys.Num0 && character <= keys.Num9;
			var isNumPadNumber = character >= keys.NumPad0 && character <= keys.NumPad9;
			
			return isNumber || isNumPadNumber;
		} else if (maskCharacter === keys.a || maskCharacter === keys.z) {
			if (character >= keys.a && character <= keys.z) {
				return true;
			}
		}

		return false;
    });

    var processCharacter = (function (element, characterCode) {
        var maskLimitReached =
            (options.MaskMode && options.MaskMode === MaskMode.Normal && element.value.length === mask.length) ||
            (options.MaskMode && options.MaskMode === MaskMode.Off && options.MaxLength && options.MaxLength > 0);

        if (maskLimitReached) {
            return false;
        }

        if (hasMask) {
            insertMaskCharacters(element, getCursorPosition(element));
        }

        if (characterCode >= keys.NumPad0 && characterCode <= keys.NumPad9) {
            characterCode = characterCode - 48;
        }

        var characterAllowed = characterRequest(characterCode, mask[getCursorPosition(element)].charCodeAt(0));

        log("character allowed: " + characterAllowed);

        if (characterAllowed) {
            var character = event.shiftKey
                ? String.fromCharCode(characterCode).toUpperCase()
                : String.fromCharCode(characterCode).toLowerCase();

            log("character is: " + character);

            if (options.ForceUpper) {
                log("forcing uppercase");

                character = character.toUpperCase();
            }

            if (options.ForceLower) {
                log("forcing lowercase");

                character = character.toLowerCase();
            }

            insertCharacterAtIndex(element, character, getCursorPosition(element));

            if (hasMask) {
                insertMaskCharacters(element, getCursorPosition(element));
            }

            return true;
        }

        return false;
    });

    var events = {
        onFocus: (function(event, element) {
            maskElement(element);

            if (element.value.length > 0) {
                element.setAttribute(attributes.PREVIOUS_VALUE, element.value);

                element.select();
            } else {
                element.focus();
            }

            return true;
        }),
        onBlur: (function (event, element) {
            if (hasMask) {
                validateElement(element);
            }

            if (options.UnMaskOnBlur) {
                unMaskElement(element);
            }
            
            return true;
        }),
        onKeyDown: (function(event, element) {
            var key = event.which;
            
            var copyCutPasteKeys = [keys.v, keys.c, keys.x].indexOf(key) > -1 && event.ctrlKey;

            var movementKeys = [keys.left, keys.right, keys.tab].indexOf(key) > -1;

            var modifierKeys = event.ctrlKey || event.shiftKey;
            
            if (copyCutPasteKeys || movementKeys || modifierKeys) {
                log("control flow key pressed, exiting");

                return true;
            }

            if (element.value.length > 0) {
                if (element.selectionStart === 0 && element.selectionEnd === element.value.length) {
                    log("all text was selected, clearing element value");

                    element.value = "";
                } else if (element.selectionStart > 0 && element.selectionEnd > element.selectionStart) {
                    log("text was selected, clearing that value");
                    
                    //var startIndex = element.selectionStart;

                    //var character = event.shiftKey
                    //    ? String.fromCharCode(key).toUpperCase()
                    //    : String.fromCharCode(key).toLowerCase();

                    //var characterAllowed = characterRequest(character, mask[startIndex].charCodeAt(0));

                    //if (characterAllowed) {
                    //    var firstPart = element.value.substr(0, element.selectionStart);

                    //    var lastPart = element.value.substr(element.selectionEnd, element.value.length - element.selectionEnd);

                    //    log("last part: " + lastPart);

                    //    var lastPartCleaned = removeMaskCharactersFromString(lastPart);

                    //    log("last part cleaned: " + lastPartCleaned);

                    //    element.value = firstPart;

                    //    setCursorPosition(element, element.value.length);

                    //    processCharacter(element, key);

                    //    for (var i = 0; i < lastPart.length; i++) {
                    //        processCharacter(element, lastPart.charCodeAt(i));
                    //    }

                    //    if (hasMask) {
                    //        log("index: " + startIndex);
                    //        while (formatCharacters.indexOf(mask[startIndex]) > -1) {
                    //            startIndex++;
                    //            log("index: " + startIndex);
                    //        }
                    //    }

                    //    setCursorPosition(element, ++startIndex);
                    //}

                    //event.preventDefault();

                    //return false;
                }
            }

            switch (key) {
                case keys.escape:
                {
                    log("escape pressed");
                    var previousValue = element.getAttribute(attributes.PREVIOUS_VALUE);

                    if (previousValue) {
                        element.value = previousValue;
                    }

                    document.activeElement.blur();

                    event.preventDefault();

                    return false;
                }
                case keys.backspace:
                {
                    log("backspace pressed");

                    removeMaskCharacters(element, getCursorPosition(element) - 1, key);

                    removeCharacterAtIndex(element, getCursorPosition(element) - 1);

                    event.preventDefault();

                    return false;
                }
                case keys.delete:
                {
                    log("delete pressed");

                    removeMaskCharacters(element, getCursorPosition(element), key);

                    removeCharacterAtIndex(element, getCursorPosition(element));

                    event.preventDefault();

                    return false;
                }
                case keys.enter:
                {
                    log("enter pressed");

                    if (options.SetValueOnEnter && options.EnterFunction) {
                        element.value = options.EnterFunction();

                        event.preventDefault();

                        return false;
                    }
                }
            }

            processCharacter(element, key);
            
            event.preventDefault();

            return false;
        }),
        onPaste: (function(event, element) {
            var pastedText = "";

            if (window.clipboardData && window.clipboardData.getData) {
                pastedText = window.clipboardData.getData("text");
            } else if (event.clipboardData && event.clipboardData.getData) {
                pastedText = event.clipboardData.getData("text/plain");
            }

            if (pastedText) {
                if (element.value.length > 0) {
                    return false;
                }

                for (var i = 0; i < pastedText.length; i++) {
                    processCharacter(element, pastedText[i].charCodeAt(0));
                }
            }

            return false;
        })
    };

    return {
        Initialize: (function(elements) {
            elements = elements || document.querySelectorAll(options.ElementSelector);

            if (!options) {
                log("No options were passed in");

                return;
            }

            if (!elements) {
                log("No elements to mask");

                return;
            }

            [].forEach.call(elements, function (element) {
                var isTextBox = element.tagName && element.tagName.toLowerCase() === "input" && element.type.toLowerCase() === "text";

                if (!element || !isTextBox) {
                    log("Element is null");
                } else if (!options.Mask || options.Mask.length === 0) {
                    log("No mask defined");
                } else if (element.getAttribute(attributes.ALREADY_BOUND)) {
                    log("Skipping already bound element: " + element.getAttribute(attributes.ID));
                } else {
                    var elementIsReadOnly = element.getAttribute(attributes.READ_ONLY);

                    element.onfocus = (function (event) {
                        log("onFocus called for element: " + element.getAttribute(attributes.ID));

                        if (!elementIsReadOnly) {
                            return events.onFocus(event, element);
                        }

                        log("onFocus called for element: " + element.getAttribute(attributes.ID));

                        return true;
                    });

                    element.onblur = (function (event) {
                        log("onBlur called for element: " + element.getAttribute(attributes.ID));

                        if (!elementIsReadOnly) {
                            return events.onBlur(event, element);
                        }

                        log("onBlur called for element: " + element.getAttribute(attributes.ID));

                        return true;
                    });

                    element.onkeydown = (function(event) {
                        log("onKeyDown called for element: " + element.getAttribute(attributes.ID));

                        if (!elementIsReadOnly) {
                            return events.onKeyDown(event, element);
                        }

                        log("onKeyDown finished for element: " + element.getAttribute(attributes.ID));

                        return true;
                    });

                    element.onpaste = (function(event) {
                        log("onPaste called for element: " + element.getAttribute(attributes.ID));

                        if (!elementIsReadOnly) {
                            return events.onPaste(event, element);
                        }

                        log("onPaste finished for element: " + element.getAttribute(attributes.ID));

                        return true;
                    });
                    
                    if (options.ShowPlaceHolder) {
                        var placeHolder = options.PlaceHolder.length > 0 ? options.PlaceHolder : options.Mask;

                        element.setAttribute(attributes.PLACEHOLDER, placeHolder);
                    }

                    var parseDate = function (value, format) {
                        var now = new Date();

                        var date = new Date(Date.UTC(
                            now.getFullYear(),
                            now.getMonth(),
                            now.getDate(),
                            now.getHours(),
                            now.getMinutes(),
                            now.getSeconds()
                        ));

                        if (value) {
                            if (format >= 1 && format <= 3) {
                                var tempDate = new Date(value);

                                if (!isNaN(tempDate.getTime())) {
                                    date = new Date(Date.UTC(
                                        tempDate.getFullYear(),
                                        tempDate.getMonth(),
                                        tempDate.getDate(),
                                        tempDate.getHours(),
                                        tempDate.getMinutes(),
                                        tempDate.getSeconds()
                                    ));
                                }
                            } else {
                                var timeSegments = value.split(":");

                                var utcHours = timeSegments.length > 0 ? timeSegments[0] : 0;
                                var utcMinutes = timeSegments.length > 1 ? timeSegments[1] : 0;
                                var utcSeconds = timeSegments.length > 2 ? timeSegments[2] : 0;

                                date.setUTCHours(utcHours, utcMinutes, utcSeconds);
                            }
                        }

                        return date;
                    };

                    var getFormattedDateTime = function (value, format) {
                        var date = parseDate(value, format);

                        var day = date.getUTCDate() < 10 ? "0" + date.getUTCDate() : date.getUTCDate();
                        var month = (date.getUTCMonth() + 1) < 10 ? "0" + (date.getUTCMonth() + 1) : (date.getUTCMonth() + 1);
                        var year = date.getUTCFullYear();
                        var hours = date.getUTCHours() < 10 ? "0" + date.getUTCHours() : date.getUTCHours();
                        var minutes = date.getUTCMinutes() < 10 ? "0" + date.getUTCMinutes() : date.getUTCMinutes();
                        var seconds = date.getUTCSeconds() < 10 ? "0" + date.getUTCSeconds() : date.getUTCSeconds();

                        switch (format) {
                            case 1:
                                return month + "/" + day + "/" + year;
                            case 2:
                                return month + "/" + day + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
                            case 3:
                                return month + "/" + day + "/" + year + " " + hours + ":" + minutes;
                            case 4:
                                return hours + ":" + minutes + ":" + seconds;
                            case 5:
                                return hours + ":" + minutes;
                            default:
                                return "";
                        }
                    };

                    if (options.DateFormat && element.value.length > 0) {
                        log("formatting date/time");

                        element.value = getFormattedDateTime(element.value, options.DateFormat);
                    }

                    if (element.value.length > 0 && !options.UnMaskOnBlur) {
                        log("format called for element: " + element.getAttribute(attributes.ID));

                        maskElement(element);

                        log("format finished for element: " + element.getAttribute(attributes.ID));
                    }

                    element.setAttribute(attributes.ALREADY_BOUND, "");
                }
            });

            document.activeElement.blur();
        })
    };
});

//new InputMaskV2({
//    DebugMode: true,
//    ElementSelector: "",
//    Mask: PreDefinedMask.PhoneNumber,
//    MaskMode: MaskMode.Normal,
//    ShowMask: false,
//    ForceUpper: false,
//    ForceLower: false,
//    MinLength: 0,
//    MaxLength: 0,
//    PlaceHolder: "",
//    UnMaskOnBlur: false,
//    ShowPlaceHolder: true,
//    OnValidationFail: (function() {}),
//    SetValueOnEnter: true,
//    EnterFunction: (function() {})
//}).Initialize();