"use strict";
 
(function($){
    window.Plugin = function(debugMode)
    {
        this.debugMode = debugMode || false;
        this._messageListener = null;
    };
 
    $.extend(window.Plugin.prototype,
    {
        /**
         * Dictionary of enums
         */
        dictionary: {
            astatus: {
                pending: {
                    label: 'pending',
                    translation: 'Pending',
                    outs: ['started', 'cancelled'],
                    color: '#FFDE00'
                },
                started: {
                    label: 'started',
                    translation: 'Started',
                    outs: ['complete', 'suspended', 'notdone', 'cancelled'],
                    color: '#A2DE61'
                },
                complete: {
                    label: 'complete',
                    translation: 'Completed',
                    outs: [],
                    color: '#79B6EB'
                },
                suspended: {
                    label: 'suspended',
                    translation: 'Suspended',
                    outs: [],
                    color: '#9FF'
                },
                notdone: {
                    label: 'notdone',
                    translation: 'Not done',
                    outs: [],
                    color: '#60CECE'
                },
                cancelled: {
                    label: 'cancelled',
                    translation: 'Cancelled',
                    outs: [],
                    color: '#80FF80'
                }
            },
            invpool: {
                customer: {
                    label: 'customer',
                    translation: 'Customer',
                    outs: ['deinstall'],
                    color: '#04D330'
                },
                install: {
                    label: 'install',
                    translation: 'Installed',
                    outs: ['provider'],
                    color: '#00A6F0'
                },
                deinstall: {
                    label: 'deinstall',
                    translation: 'Deinstalled',
                    outs: ['customer'],
                    color: '#00F8E8'
                },
                provider: {
                    label: 'provider',
                    translation: 'Resource',
                    outs: ['install'],
                    color: '#FFE43B'
                }
            }
        },
 
        /**
         * Which field shouldn't be editable
         *
         * format:
         *
         * parent: {
         *     key: true|false
         * }
         *
         */
        renderReadOnlyFieldsByParent: {
            data: {
                apiVersion: true,
                method: true,
                entity: true
            },
            resource: {
                pid: true,
                pname: true,
                gender: true
            }
        },
 
        /**
         * Check for string is valid JSON
         *
         * @param {*} str - String that should be validated
         *
         * @returns {boolean}
         *
         * @private
         */
        _isJson: function(str)
        {
            try
            {
                JSON.parse(str);
            }
            catch (e)
            {
                return false;
            }
            return true;
        },
 
        /**
         * Return origin of URL (protocol + domain)
         *
         * @param {String} url
         *
         * @returns {String}
         *
         * @private
         */
        _getOrigin: function(url)
        {
            if (url != '')
            {
                if (url.indexOf("://") > -1)
                {
                    return 'https://' + url.split('/')[2];
                }
                else
                {
                    return 'https://' + url.split('/')[0];
                }
            }
 
            return '';
        },
 
        /**
         * Return domain of URL
         *
         * @param {String} url
         *
         * @returns {String}
         *
         * @private
         */
        _getDomain: function(url)
        {
            if (url != '')
            {
                if (url.indexOf("://") > -1)
                {
                    return url.split('/')[2];
                }
                else
                {
                    return url.split('/')[0];
                }
            }
 
            return '';
        },
 
        /**
         * Sends postMessage to document.referrer
         *
         * @param {Object} data - Data that will be sent
         *
         * @private
         */
        _sendPostMessageData: function(data)
        {
            if (document.referrer !== '')
            {
                this._log(window.location.host + ' -> ' + data.method + ' ' + this._getDomain(document.referrer), JSON.stringify(data, null, 4));
 
                parent.postMessage(JSON.stringify(data), this._getOrigin(document.referrer));
            }
        },
 
        /**
         * Handles during receiving postMessage
         *
         * @param {MessageEvent} event - Javascript event
         *
         * @private
         */
        _getPostMessageData: function(event)
        {
            if (typeof event.data !== 'undefined')
            {
                if (this._isJson(event.data))
                {
                    var data = JSON.parse(event.data);
 
                    if (data.method)
                    {
                        this._log(window.location.host + ' <- ' + data.method + ' ' + this._getDomain(event.origin), JSON.stringify(data, null, 4));
 
                        switch (data.method)
                        {
                            case 'open':
                                this.pluginOpen(data);
 
                                break;
                            case 'error':
                                data.errors = data.errors || {error: 'Unknown error'};
                                this._showError(data.errors);
 
                                break;
                            default:
                                alert('Unknown method');
 
                                break;
                        }
                    }
                    else
                    {
                        this._log(window.location.host + ' <- NO METHOD ' + this._getDomain(event.origin), null, null, true);
                    }
                }
                else
                {
                    this._log(window.location.host + ' <- NOT JSON ' + this._getDomain(event.origin), null, null, true);
                }
            }
            else
            {
                this._log(window.location.host + ' <- NO DATA ' + this._getDomain(event.origin), null, null, true);
            }
        },
 
        /**
         * Show alert with error
         *
         * @param {Object} errorData - Object with errors
         *
         * @private
         */
        _showError: function(errorData)
        {
            alert(JSON.stringify(errorData, null, 4));
        },
 
        /**
         * Logs to console
         *
         * @param {String} title - Message that will be log
         * @param {String} [data] - Formatted data that will be collapsed
         * @param {String} [color] - Color in Hex format
         * @param {Boolean} [warning] - Is it warning message?
         *
         * @private
         */
        _log: function(title, data, color, warning)
        {
            if (!this.debugMode)
            {
                return;
            }
            if (!color)
            {
                color = '#0066FF';
            }
            if (!!data)
            {
                console.groupCollapsed('%c[Plugin API] ' + title, 'color: ' + color + '; ' + (!!warning ? 'font-weight: bold;' : 'font-weight: normal;'));
                console.log('[Plugin API] ' + data);
                console.groupEnd();
            }
            else
            {
                console.log('%c[Plugin API] ' + title, 'color: ' + color + '; ' + (!!warning ? 'font-weight: bold;' : ''));
            }
        },
 
        /**
         * Business login on plugin init
         */
        pluginInit: function()
        {
            var data = {
                initTime: new Date().getTime()
            };
 
            this._log(window.location.host + ' INIT. SET DATA TO LOCAL STORAGE', JSON.stringify(data, null, 4));
 
            localStorage.setItem('pluginInitData', JSON.stringify(data));
        },
 
        /**
         * Business login on plugin open
         *
         * @param {Object} receivedData - JSON object that contain data from OFSC
         */
        pluginOpen: function(receivedData)
        {
            this._log(window.location.host + ' OPEN. GET DATA FROM LOCAL STORAGE', JSON.stringify(JSON.parse(localStorage.getItem('pluginInitData')), null, 4));
            $('.json__local-storage').text(localStorage.getItem('pluginInitData'));
            $('.section__local-storage').show();
 
            $('.form').html(this.renderForm(receivedData));
 
            $('.button__generate_sign').on('click', function(e)
            {
                var canvasElement = $('<canvas>').addClass('value').attr({height: 240, width: 320}).get(0);
                $(e.target).after(canvasElement);
                drawSampleSignature(canvasElement);
 
                $(e.target).parents('.item').addClass('edited');
 
                this._updateResponseJSON();
 
                $(e.target).remove();
            }.bind(this));
 
            $('.value__item').on('input, change', function(e)
            { //IE10+
                $(e.target).parents('.item').addClass('edited');
 
                this._updateResponseJSON();
            }.bind(this));
 
            $('.back_method_select, .back_activity_id').on('change', function(e)
            { //IE10+
                this._updateResponseJSON();
            }.bind(this));
 
            $('.json__request').text(JSON.stringify(receivedData, null, 4));
 
            $('.submit').click(function()
            {
                var json_response = $('.json__response');
                if (json_response.is(":hidden") === true)
                {
                    var form = this.parseForm($('.form'));
                    this._sendPostMessageData(form.data);
                }
                else
                {
                    if (this._isJson(json_response.text()))
                    {
                        var data = JSON.parse(json_response.text());
                        this._sendPostMessageData(data);
                    }
                    else
                    {
                        alert('JSON parse error!');
                    }
                }
            }.bind(this));
 
            $('.section__ofsc-data').show();
        },
 
        /**
         * Render JSON object to DOM
         *
         * @param {Object} data - JSON object
         *
         * @returns {jQuery}
         */
        renderForm: function(data)
        {
            return this.renderCollection('data', data, true);
        },
 
        /**
         * Render JSON object to follow HTML:
         *
         * <div class="item">
         *     <div class="key">{key}</div>
         *     <div class="value">{value}</div>
         * </div>
         * <div class="item">
         *     <div class="key">{key}</div>
         *     <div class="value">
         *         <div class="items">
         *              <div class="item">
         *                  <div class="key">{key}</div>
         *                  <div class="value">{value}</div>
         *              </div>
         *              <div class="item">
         *                  <div class="key">{key}</div>
         *                  <div class="value">{value}</div>
         *              </div>
         *              ...
         *         </div>
         *     </div>
         * </div>
         * ...
         *
         * @param {String} key - Collection name
         * @param {Object} items - Child items of collection
         * @param {Boolean} [isWritable] - Will render as writable?
         * @param {number} [level] - Level of recursion
         * @param {string} [parentKey] - parent Key
         *
         * @returns {jQuery}
         */
        renderCollection: function(key, items, isWritable, level, parentKey)
        {
            var render_item = $('<div>').addClass('item');
            var render_key = $('<div>').addClass('key').text(key);
            var render_value = $('<div>').addClass('value value__collection');
            var render_items = $('<div>').addClass('items');
 
            isWritable = isWritable || false;
            level = level || 1;
            parentKey = parentKey || '';
 
            var newParentKey = key;
 
            if (items)
            {
                $.each(items, function(key, value)
                {
                    if (value && typeof value === 'object')
                    {
                        render_items.append(this.renderCollection(key, value, isWritable, level + 1, newParentKey));
                    }
                    else
                    {
                        render_items.append(this.renderItem(key, value, isWritable, level + 1, newParentKey).get(0));
                    }
                }.bind(this));
            }
 
            render_item.append(render_key)/*.append('<span>: </span>')*/;
 
            render_value.append(render_items);
            render_item.append($('<br>'));
            render_item.append(render_value);
 
            return render_item;
 
        },
 
        /**
         * Render key and value to follow HTML:
         *
         * <div class="item">
         *     <div class="key">{key}</div>
         *     <div class="value">{value}</div>
         * </div>
         *
         * @param {String} key - Key
         * @param {String} value - Value
         * @param {Boolean} [isWritable] - Will render as writable?
         * @param {number} [level] - Level of recursion
         * @param {string} [parentKey] - parent Key
         *
         * @returns {jQuery}
         */
        renderItem: function(key, value, isWritable, level, parentKey)
        {
            var render_item = $('<div>').addClass('item');
            var render_value;
            var render_key;
 
            isWritable = isWritable || false;
            level = level || 1;
            parentKey = parentKey || '';
 
            render_key = $('<div>').addClass('key').text(key);
            render_item.append(render_key).append('<span class="delimiter">: </span>');
 
            if (value === null)
            {
                value = '';
            }
 
            if (typeof this.renderReadOnlyFieldsByParent[parentKey] !== 'undefined' && typeof this.renderReadOnlyFieldsByParent[parentKey][key] !== 'undefined' && this.renderReadOnlyFieldsByParent[parentKey][key] === true)
            {
                isWritable = false;
            }
 
            switch (key)
            {
                case "csign":
                    if (isWritable)
                    {
                        render_value = $('<button>').addClass('button but-ton__generate_sign').text('Generate');
                    }
                    break;
                default:
                    if (this.dictionary[key])
                    {
                        render_value = this.renderSelect(this.dictionary, key, value, isWritable).addClass('value value__item');
                    }
                    else
                    {
                        render_value = $('<div>').addClass('value val-ue__item').text(value);
                        if (isWritable)
                        {
                            render_value.addClass('writable').attr('contenteditable', true);
                        }
                    }
 
                    break;
            }
            render_item.append(render_value);
 
            return render_item;
        },
 
        /**
         * Render enums
         *
         * <select class="value [writable]" [disabled]>
         *     <option value="{value}" [selected]>{dictionary}</option>
         *     ...
         * </select>
         *
         * @param {Object} dictionary - Dictionary that will be used for Enum rendering
         * @param {String} key - Just field name
         * @param {String} value - Selected value
         * @param {Boolean} isWritable - Will render as writable?
         *
         * @returns {HTMLElement}
         */
        renderSelect: function(dictionary, key, value, isWritable)
        {
            var render_value;
 
            var outs = dictionary[key][value].outs;
            var allowedValues = [value].concat(outs);
            var disabled = '';
 
            render_value = $('<select>').css({background: diction-ary[key][value].color});
 
            if (isWritable)
            {
                render_value.addClass('writable');
            }
 
            if (!outs.length || !isWritable)
            {
                render_value.attr('disabled', true);
                render_value.removeClass('writable');
            }
 
            $.each(allowedValues, function(index, label)
            {
                render_value.append('<option' + (label === value ? ' selected' : '') + ' value="' + dictionary[key][label].label + '">' + diction-ary[key][label].translation + '</option>');
            });
 
            return render_value;
        },
 
        /**
         * Parse form (root HTML element that was rendered)
         *
         * @param {HTMLElement} element - root HTML element
         *
         * @returns {Object}
         */
        parseForm: function(element)
        {
            var form = {};
 
            form.data = {
                apiVersion: 1,
                method: 'close',
                backScreen: $('.back_method_select').val()
            };
 
            if (form.data.backScreen === 'activity_by_id')
            {
                $.extend(form.data, {
                    backActivityId: $('.back_activity_id').val()
                });
            }
 
            $.extend(form.data, this.parseCollection(element).data);
 
            delete form.data.entity;
            delete form.data.resource;
 
            return form;
        },
 
        /**
         * Convert HTML elements to JSON
         *
         * @param {HTMLElement} rootElement - Root element that should be parsed recursively
         *
         * @returns {Object}
         *
         * <div class="key">activity</div>
         * <div class="value value__collection">
         *     <div class="items"> <-------------------------------- rootElement !!!
         *         <div class="item edited">
         *             <div class="key">WO_COMMENTS</div>
         *             <div class="value">text_comments</div>
         *         </div>
         *         <div class="item">
         *             <div class="key">aid</div>
         *             <div class="value">4225274</div>
         *         </div>
         *         <div class="item">
         *             <div class="key">caddress</div>
         *             <div class="value">text_address</div>
         *         </div>
         *     </div>
         * </div>
         *
         * converts to:
         *
         * {
         *     "aid": "4225274",
         *     "WO_COMMENTS": "text_comments"
         * }
         *
         */
        parseCollection: function(rootElement)
        {
 
            var returnObject = {};
 
            $(rootElement).children('.item').each(function(itemIndex, item)
            {
                var parentKey;
                var valueKey;
                var value;
                var mandatoryField = false;
 
                parentKey = $(rootElement).parent().siblings('.key').get(0);
                valueKey = $(item).children('.key').get(0);
 
                //Logic of mandatory fields
                if ((parentKey !== undefined) && (
                    ($(parentKey).text() == 'activity' && $(valueKey).text() == 'aid') ||
                    ($(parentKey).text() == 'inventory' && $(valueKey).text() == 'invid')
                ))
                {
                    mandatoryField = true;
                }
 
                if ($(item).hasClass('item') === true && ($(item).hasClass('edited') === true || mandatoryField))
                {
 
                    value = $(item).children('.value').get(0);
 
                    if ($(value).children('.items').size() > 0)
                    {
                        returnObject[$(valueKey).text()] = this.parseCollection($(value).children('.items').get(0));
                    }
                    else
                    {
                        switch ($(value).prop("tagName"))
                        {
                            case 'SELECT':
                                returnObject[$(valueKey).text()] = $(val-ue).val();
                                break;
                            case 'CANVAS':
                                returnObject[$(valueKey).text()] = val-ue.toDataURL();
                                break;
                            default:
                                returnObject[$(valueKey).text()] = $(val-ue).text();
                                break;
                        }
                    }
                }
            }.bind(this));
 
            return returnObject;
        },
 
        /**
         * Update JSON
         *
         * @private
         */
        _updateResponseJSON: function()
        {
            var form = this.parseForm($('.form'));
            $('.json__response').text(JSON.stringify(form.data, null, 4));
        },
 
        /**
         * Initialization function
         */
        init: function()
        {
            $('.back_method_select').change(function()
            {
                if ($('.back_method_select').val() == 'activity_by_id')
                {
                    $('.back_activity_id').show();
                }
                else
                {
                    $('.back_activity_id').val('').hide();
                }
            });
 
            $('.json_request_toggle').click(function()
            {
                $('.json__response').hide();
                $('.json__request').toggle();
            });
 
            $('.json_response_toggle').click(function()
            {
                $('.json__request').hide();
                this._updateResponseJSON();
                $('.json__response').toggle();
            }.bind(this));
 
            this._messageListener =  this._getPostMessageData.bind(this);
 
            window.addEventListener("message", this._messageListener, false); //Only IE9+
 
            this.pluginInit();
 
            this._sendPostMessageData({
                apiVersion: 1,
                method: 'ready'
            });
        }
    });
 
})(jQuery);
