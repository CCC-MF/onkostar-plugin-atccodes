class AtcCodesDialog {

    static show(context, plainfield = 'wirkstoffe', jsonfield = 'wirkstoffejson') {

        const availableStore = new Ext.data.ArrayStore({
            fields: [
                {name: 'code'},
                {name: 'name'},
                {name: 'system'}
            ]
        });

        const selectedStore = new Ext.data.ArrayStore({
            fields: [
                {name: 'code'},
                {name: 'name'},
                {name: 'system'}
            ]
        });

        let pluginRequestsDisabled = false;
        let available = [];
        let selected = [];
        let blockIndex = null;

        const findButtonFieldFormInformation = () => {
            const findElemId = (elem) => {
                if (elem.tagName === 'BODY') {
                    return undefined;
                }

                if (elem.tagName === 'TABLE') {
                    return elem.id;
                }

                return findElemId(elem.parentElement);
            }

            const formInfo = (formItem, blockIndex = undefined) => {
                if (formItem.xtype === 'buttonField') {
                    return formInfo(formItem.ownerCt, formItem.blockIndex);
                }

                if (formItem.xtype === 'panel') {
                    return formInfo(formItem.ownerCt, blockIndex);
                }

                if (formItem.xtype === 'subformField') {
                    return {
                        isSubform: true,
                        formName: formItem.formName,
                        subformFieldName: formItem.subformName,
                        blockIndex: blockIndex
                    };
                }

                if (formItem.xtype === 'form') {
                    return {
                        isSubform: false,
                    };
                }

                console.warn('No information found!');
                return undefined;
            }

            if (context.genericEditForm && document.activeElement.tagName === 'BUTTON') {
                let elemId = findElemId(document.activeElement);
                if (elemId) {
                    let formItem = context.genericEditForm.down('#'+elemId);
                    if (formItem) {
                        return formInfo(formItem);
                    }
                }
            }

            return undefined;
        }

        const request = (q) => {
            if (pluginRequestsDisabled || !context.executePluginMethod) return;
            context.executePluginMethod(
                'AtcCodesPlugin',
                'query',
                {q: q, size: 25},
                (response) => {
                    if (response.status.code < 0) {
                        onFailure();
                        return;
                    }
                    onSuccess(response.result);
                },
                false
            );
        };

        const addItem = (item) => {
            selected.push(item);
            const extData = selected.map((item) => [item.code, item.name, item.system]);
            selectedStore.loadData(extData);
        };

        const removeItem = (index) => {
            selected.splice(index, 1);
            const extData = selected.map((item) => [item.code, item.name, item.system]);
            selectedStore.loadData(extData);
        };

        const save = () => {
            const names = selected.map((item) => {
                return item.name;
            }).join("\n");

            let field = context.getFieldByEntriesArray('wirkstoffe', blockIndex);
            if (field) {
                field.setValue(names);
            }

            let jsonfield = context.getFieldByEntriesArray('wirkstoffejson', blockIndex);
            if (jsonfield) {
                jsonfield.setValue(JSON.stringify(selected));
            }
        };

        const onFailure = () => {
            pluginRequestsDisabled = true;
            Ext.MessageBox.show({
                title: 'Hinweis',
                msg: 'Plugin "ATC-Codes und Substanzen" nicht verfügbar. Sie können Substanzen nur über "Aus Suchfeld hinzufügen" hinzufügen.',
                buttons: Ext.MessageBox.OKCANCEL
            });
        };

        const onSuccess = (d) => {
            available = d;
            const extData = available.map((item) => [item.code, item.name, item.system]);
            availableStore.loadData(extData);
        }

        const showDialog = () => {
            let selectedItemIndex = -1;
            let deselectedItemIndex = -1;
            let queryString = '';

            try {
                selected = JSON.parse(context.getFieldValue(jsonfield, blockIndex));
                const extData = selected.map((item) => [item.code, item.name, item.system]);
                selectedStore.loadData(extData);
            } catch (e) {
                selected = [];
                const extData = selected.map((item) => [item.code, item.name, item.system]);
                selectedStore.loadData(extData);
            }

            const query = new Ext.form.field.Text({
                name: 'query',
                fieldLabel: 'Suche',
                padding: 8,
                listeners: {
                    change: (f) => {
                        queryString = f.value;
                        request(f.value);
                        if (f.value.length > 0) {
                            Ext.getCmp('btnUnknownAgent').setDisabled(false);
                        } else {
                            Ext.getCmp('btnUnknownAgent').setDisabled(true);
                        }
                    }
                }
            });

            const gridColumns = [
                {header: 'Code', width: 72, sortable: false, dataIndex: 'code'},
                {header: 'Name', width: 340, sortable: false, dataIndex: 'name'},
                {header: 'System', width: 72, sortable: false, dataIndex: 'system'},
            ];

            const availableGrid = new Ext.grid.GridPanel({
                title: 'Verfügbar',
                store: availableStore,
                loadMask: true,
                border: true,
                columns: gridColumns,
                flex: 1,
                overflowY: 'scroll',
                listeners: {
                    itemclick: (dv, record, item, index) => {
                        selectedItemIndex = index;
                        Ext.getCmp('btnAddAgent').setDisabled(false);
                    },
                    itemdblclick: (dv, record, item, index) => {
                        selectedItemIndex = -1
                        addItem(available[index]);
                        Ext.getCmp('btnAddAgent').setDisabled(true);
                    }
                }
            });

            const selectedGrid = new Ext.grid.GridPanel({
                title: 'Ausgewählt',
                store: selectedStore,
                loadMask: true,
                border: true,
                columns: gridColumns,
                flex: 1,
                overflowY: 'scroll',
                listeners: {
                    itemclick: (dv, record, item, index) => {
                        deselectedItemIndex = index;
                        Ext.getCmp('btnRmAgent').setDisabled(false);
                    },
                    itemdblclick: (dv, record, item, index) => {
                        deselectedItemIndex = -1
                        removeItem(index);
                        Ext.getCmp('btnRmAgent').setDisabled(true);
                    }
                }
            });

            const gridLayout = Ext.create('Ext.Panel', {
                flex: 1,
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },
                items: [availableGrid, {xtype: 'splitter'}, selectedGrid]
            });

            const layout = Ext.create('Ext.Panel', {
                flex: 1,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: [query, gridLayout]
            });

            Ext.create('Ext.window.Window', {
                title: 'Substanz auswählen',
                height: 600,
                width: 1000,
                layout: 'fit',
                items: [layout],
                buttons: [{
                    id: 'btnAddAgent',
                    text: 'Hinzufügen',
                    disabled: true,
                    handler: () => {
                        addItem(available[selectedItemIndex]);
                        Ext.getCmp('btnAddAgent').setDisabled(true);
                    }
                }, {
                    id: 'btnUnknownAgent',
                    text: 'Aus Suchfeld hinzufügen',
                    disabled: true,
                    handler: () => {
                        addItem({
                            code: '',
                            name: queryString,
                            system: 'UNREGISTERED'
                        });
                        Ext.getCmp('btnUnknownAgent').setDisabled(true);
                    }
                }, {
                    id: 'btnRmAgent',
                    text: 'Entfernen',
                    disabled: true,
                    handler: () => {
                        removeItem(deselectedItemIndex);
                        Ext.getCmp('btnRmAgent').setDisabled(true);
                    }
                }, {
                    text: 'Übernehmen',
                    cls: 'onko-btn-cta',
                    handler: () => {
                        save();
                        let win = Ext.WindowManager.getActive();
                        if (win) {
                            win.close();
                        }
                    }
                }]
            }).show();

            request('');
        }

        let buttonFieldFormInformation = findButtonFieldFormInformation();
        if (buttonFieldFormInformation && buttonFieldFormInformation.blockIndex) {
            blockIndex = buttonFieldFormInformation.blockIndex;
        }

        showDialog();
    }

}

/**
 * Wrapper for use with ExtJS
 *
 * Use with:
 *
 * let AtcCodesDialog = Ext.ClassManager.get('AtcCodesDialog');
 * AtcCodesDialog.show(this);
 */
Ext.define('AtcCodesDialog', {
    statics: {
        show: AtcCodesDialog.show
    }
});