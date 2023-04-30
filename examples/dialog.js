const availableStore = new Ext.data.ArrayStore({
    fields: [
        {name: 'code'},
        {name: 'name'},
        {name: 'system'},
        {name: 'version'}
    ]
});

const selectedStore = new Ext.data.ArrayStore({
    fields: [
        {name: 'code'},
        {name: 'name'},
        {name: 'system'},
        {name: 'version'}
    ]
});

let pluginRequestsDisabled = false;
let available = [];
let selected = [];
let blockIndex = null;

const findButtonFieldFormInformation = function(context) {
    const findElemId = function(elem) {
        if (elem.tagName === 'BODY') {
            return undefined;
        }

        if (elem.tagName === 'TABLE') {
            return elem.id;
        }

        return findElemId(elem.parentElement);
    }

    const formInfo = function(formItem, blockIndex = undefined) {
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

const request = function (q) {
    if (pluginRequestsDisabled) return;
    executePluginMethod(
        'AtcCodesPlugin',
        'query',
        {q: q, size: 25},
        function (response) {
            if (response.status.code < 0) {
                onFailure();
                return;
            }
            onSuccess(response.result);
        },
        false
    );
};

const addItem = function (item) {
    selected.push(item);
    const extData = selected.map((item) => [item.code, item.name, item.system, item.version]);
    selectedStore.loadData(extData);
};

const removeItem = function (index) {
    selected.splice(index, 1);
    const extData = selected.map((item) => [item.code, item.name, item.system, item.version]);
    selectedStore.loadData(extData);
};

const save = () => {
    const names = selected.map((item) => {
        return item.name;
    }).join("\n");

    this.getFieldByEntriesArray('wirkstoffe', blockIndex).setValue(names);
    this.getFieldByEntriesArray('wirkstoffejson', blockIndex).setValue(JSON.stringify(selected));
};

const onFailure = function() {
    pluginRequestsDisabled = true;
    Ext.MessageBox.show({
        title: 'Hinweis',
        msg: 'Plugin "ATC-Codes und Substanzen" nicht verfügbar. Sie können Substanzen nur über "Aus Suchfeld hinzufügen" hinzufügen.',
        buttons: Ext.MessageBox.OKCANCEL
    });
};

const onSuccess = function(d) {
    available = d;
    const extData = available.map((item) => [item.code, item.name, item.system, item.version]);
    availableStore.loadData(extData);
}

const showDialog = function () {
    let selectedItemIndex = -1;
    let deselectedItemIndex = -1;
    let queryString = '';

    try {
        selected = JSON.parse(getFieldValue('wirkstoffejson', blockIndex));
        const extData = selected.map((item) => [item.code, item.name, item.system, item.version]);
        selectedStore.loadData(extData);
    } catch (e) {
        selected = [];
        const extData = selected.map((item) => [item.code, item.name, item.system, item.version]);
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
        {header: 'Name', width: 300, sortable: false, dataIndex: 'name'},
        {header: 'System', width: 72, sortable: false, dataIndex: 'system'},
        {header: 'Version', width: 72, sortable: false, dataIndex: 'version'},
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
        items: [availableGrid, { xtype: 'splitter' }, selectedGrid]
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
        width: 1080,
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
};

let buttonFieldFormInformation = findButtonFieldFormInformation(this);
if (buttonFieldFormInformation && buttonFieldFormInformation.blockIndex) {
    blockIndex = buttonFieldFormInformation.blockIndex;
}

showDialog();