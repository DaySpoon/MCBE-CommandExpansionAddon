import { system, world } from "@minecraft/server";

export class Password {
    numberPassword(length = 10) {
        let password = "";
        let password_base = '0123456789';
        for (let i = 0; i < length; i++) {
            password += password_base.charAt(Math.round(Math.random() * password_base.length));
        }
        return password;
    }
    stringPassword(length = 10) {
        let password = "";
        let password_base = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < length; i++) {
            password += password_base.charAt(Math.round(Math.random() * password_base.length));
        }
        return password;
    }
    passcord(length = 10) {
        let password = "";
        let password_base = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < length; i++) {
            password += password_base.charAt(Math.round(Math.random() * password_base.length));
        }
        return password;
    }
    id(length = 10) {
        let password = "";
        let password_base = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.&#=@';
        for (let i = 0; i < length; i++) {
            password += password_base.charAt(Math.round(Math.random() * password_base.length));
        }
        return password;
    }
    hex(length = 10) {
        let password = "";
        let password_base = '0123456789ABCDEF';
        for (let i = 0; i < length; i++) {
            password += password_base.charAt(Math.round(Math.random() * password_base.length));
        }
        return password;
    }
}

export class db {
    /**
     * 
     * @param {string} name 
     */
    constructor(name) {
        this._name = name
    }

    create() {
        const key = new Password().hex(4)
        const info = {
            value: [],
            key: key
        }
        world.setDynamicProperty(`db.${this._name}.${key}`, JSON.stringify(info))
        return this
    }

    delete() {
        if (this.isValid()) {
            const db = this.get()
            world.setDynamicProperty(this.getName())
            return true;
        }
        else return false;
    }

    write(value, index = 0) {
        if (this.isValid()) {
            const db = this.get()
            db.value[index] = value;
            this.set(db)
            return this;
        }
    }

    load(index = 0) {
        if (this.isValid()) {
            const db = this.get()
            return db.value[index];
        }
    }

    set(db) {
        world.setDynamicProperty(this.getName(), JSON.stringify(db))
        return true
    }

    isValid() {
        if (world.getDynamicPropertyIds().find(k => k.startsWith(`db.${this._name}`))) {
            return true;
        }
        else return false;
    }

    get() {
        if (this.isValid()) {
            const index = world.getDynamicPropertyIds().find(k => k.startsWith(`db.${this._name}`))
            const name = world.getDynamicPropertyIds()[index]
            const id = name.split(".")[2]
            return JSON.parse(world.getDynamicProperty(`${name}`));
        }
        else return undefined;
    }

    getName() {
        if (this.isValid()) {
            const index = world.getDynamicPropertyIds().find(k => k.startsWith(`db.${this._name}`))
            const name = world.getDynamicPropertyIds()[index]
            const id = name.split(".")[2]
            return name;
        }
        else return undefined;
    }

    getId() {
        if (this.isValid()) {
            const index = world.getDynamicPropertyIds().find(k => k.startsWith(`db.${this._name}`))
            const name = world.getDynamicPropertyIds()[index]
            const id = name.split(".")[2]
            return id;
        }
        else return undefined;
    }
}

export class InventoryManager {
    /**
     * @param {import("./serverAPI").InventoryManagement} InventoryManagement
     */
    constructor(InventoryManagement) {
        this._target = InventoryManagement.target
        this._InventoryComponent = InventoryManagement.InventoryComponent
    }
    getItems() {
        let items = []
        for (let i = 0; i < this._InventoryComponent.container.size; i++) {
            const item = this._InventoryComponent.container.getItem(i)
            if (item === undefined) {
                items.push(new ItemStack("minecraft:air", 255))
            }
            else items.push(item)
        }
        return items;
    }

    getEquippables() {
        let equippables = []
        if (this._target.hasComponent("minecraft:equippable")) {
            const equippable = this._target.getComponent("minecraft:equippable")
            equippables.push(equippable.getEquipment(EquipmentSlot.Mainhand))
            equippables.push(equippable.getEquipment(EquipmentSlot.Offhand))
            equippables.push(equippable.getEquipment(EquipmentSlot.Feet))
            equippables.push(equippable.getEquipment(EquipmentSlot.Legs))
            equippables.push(equippable.getEquipment(EquipmentSlot.Chest))
            equippables.push(equippable.getEquipment(EquipmentSlot.Head))
        }
        return equippables;
    }
    /**
     * 
     * @returns {import("./serverAPI").InventorySaveData}
     */
    save() {
        let inventoryDATA = {
            items: [],
            equippables: []
        }
        const items = this.getItems()
        const equippables = this.getEquippables()
        const savedData = this.get()
        items.forEach((item, i) => {
            inventoryDATA.items.push(new ItemStackJSON(item).JSONstringify())
        })
        equippables.forEach((item, i) => {
            inventoryDATA.equippables.push(new ItemStackJSON(item).JSONstringify())
        })
        this.set(inventoryDATA);
        return { savedData: savedData, newSaveData: inventoryDATA };
    }

    delete() {
        if (this.isValid()) {
            this._target.setDynamicProperty("InventoryData")
            return true;
        }
        else false;
    }

    load() {
        if (this.isValid()) {
            const data = this.get()
            system.run(() => {
                data.items.forEach((item, i) => {
                    this._InventoryComponent.container.setItem(i, ItemStackJSON.parse(item))
                })
                if (this._target.hasComponent("minecraft:equippable")) {
                    const sort = [EquipmentSlot.Mainhand, EquipmentSlot.Offhand, EquipmentSlot.Feet, EquipmentSlot.Legs, EquipmentSlot.Chest, EquipmentSlot.Head]
                    const equippable = this._target.getComponent("minecraft:equippable")
                    data.equippables.forEach((item, i) => {
                        equippable.setEquipment(sort[i], ItemStackJSON.parse(item))
                    })
                }
            })
            return true;
        }
        else false;
    }

    overwrite(saveData) {
        if (this.isValid()) {
            system.run(() => {
                saveData.items.forEach((item, i) => {
                    this._InventoryComponent.container.setItem(i, ItemStackJSON.parse(item))
                })
                if (this._target.hasComponent("minecraft:equippable")) {
                    const sort = [EquipmentSlot.Mainhand, EquipmentSlot.Offhand, EquipmentSlot.Feet, EquipmentSlot.Legs, EquipmentSlot.Chest, EquipmentSlot.Head]
                    const equippable = this._target.getComponent("minecraft:equippable")
                    saveData.equippables.forEach((item, i) => {
                        equippable.setEquipment(sort[i], ItemStackJSON.parse(item))
                    })
                }
            })
            return true;
        }
        else false;
    }

    changeInventory() {
        const data = this.save()
        this.overwrite(data.savedData);
    }

    set(saveData) {
        this._target.setDynamicProperty("InventoryData", JSON.stringify(saveData))
        return this;
    }
    /**
     * 
     * @returns {import("./serverAPI").saveData}
     */
    get() {
        if (this.isValid()) {
            return JSON.parse(this._target.getDynamicProperty("InventoryData"));
        }
        else undefined;
    }

    isValid() {
        if (this._target.getDynamicProperty("InventoryData") !== undefined) {
            return true;
        }
        else return false;
    }
    /**
     * 
     * @param {ItemType} itemId 
     * @returns {Array<import("./serverAPI").findItem>}
     */
    findItems(itemId) {
        let items = []
        for (let i = 0; i < this._InventoryComponent.container.size; i++) {
            if (this._InventoryComponent.container.getItem(i) !== undefined) {
                if (this._InventoryComponent.container.getItem(i).typeId === itemId.id) {
                    items.push({ item: this._InventoryComponent.container.getItem(i), slot: i })
                }
            }
        }
        return items;
    }

    /**
     * 
     * @returns {Array<number>}
     */
    getEmptySlots() {
        let slots = []
        for (let i = 0; i < this._InventoryComponent.container.size; i++) {
            if (this._InventoryComponent.container.getItem(i) === undefined) {
                slots.push(i)
            }
        }
        return slots;
    }

    /**
     * @param {number} slot 
     * @param {number} [amount=1]
     */
    clearItem(slot, amount = 1) {
        const item = this._InventoryComponent.container.getItem(slot)
        if (item instanceof ItemStack) {
            const remove = item.amount - amount
            if (remove > 0) {
                item.amount = remove;
                this._InventoryComponent.container.setItem(slot, item)
            }
            else {
                this._InventoryComponent.container.setItem(slot)
                if (remove < 0) {
                    let counter = Math.abs(remove);
                    const stack = Math.floor(counter / 64)
                    const items = this.findItems(ItemTypes.get(item.typeId))
                    const slots = items.map(s => s.slot)
                    const it = counter - (stack * 64)
                    for (let i = 0; i <= stack; i++) {
                        if (i === 0 && it > 0) {
                            items[i].Item.amount = it
                            this._InventoryComponent.container.setItem(slots[i], it)
                        }
                        else {
                            this._InventoryComponent.container.setItem(slots[i])
                        }
                    }
                }
            }
        }
        return this;
    }

    /**
     * @param {ItemStack} item 
     * @param {number} [amount=1]
     */
    giveItem(item, amount = 1) {
        const emptySlots = this.getEmptySlots()
        if (emptySlots.length) {
            const stack = Math.floor(amount / 64)
            const it = amount - (stack * 64)
            if (emptySlots.length < stack) {
                for (let i = 0; i <= stack; i++) {
                    if (i === 0 && it > 0) {
                        item.amount = it
                        this._InventoryComponent.container.setItem(emptySlots[i], item)
                    }
                    else {
                        item.amount = 64
                        this._InventoryComponent.container.setItem(emptySlots[i], item)
                    }
                }
            }
            else {
                const out = (stack - emptySlots.length)
                for (let i = 0; i <= emptySlots; i++) {
                    if (i === 0 && it > 0) {
                        item.amount = it
                        this._InventoryComponent.container.setItem(emptySlots[i], item)
                    }
                    else {
                        item.amount = 64
                        this._InventoryComponent.container.setItem(emptySlots[i], item)
                    }
                }
                for (let i = 0; i <= out; i++) {
                    this._target.dimension.spawnItem(item, this._target.location)
                }
            }
        }
        return this;
    }
}

export class ItemStackJSON {
    /**
     * 
     * @param {ItemStack} ItemStack
     */
    constructor(ItemStack) {
        this._Item = ItemStack
    }

    isValid() {
        if (this._Item !== undefined) {
            return true;
        }
        else return false;
    }
    getDynamicProperties() {
        if (this.isValid()) {
            if (this._Item.getDynamicPropertyIds().length > 0) {
                let datas = []
                const ids = this._Item.getDynamicPropertyIds()
                ids.forEach((name, i) => {
                    const data = this._Item.getDynamicProperty(name)
                    datas.push({ id: name, data: data })
                })
                return datas;
            }
            return []
        }
        return []
    }
    /**
     * 
     * @returns {string}
     */
    JSONstringify(amount = true) {
        if (this.isValid()) {
            let JSONDATA = {
                Item: {
                    typer: this._Item.typeId,
                    nameTag: this._Item.nameTag,
                    amount: amount ? this._Item.amount : 1,
                    dynamicproperties: this.getDynamicProperties(),
                    mode: {
                        canPlace: [],
                        canDestroy: []
                    },
                    lore: this._Item.getRawLore(),
                    components: [],
                }
            }
            if (this._Item.hasComponent("minecraft:durability")) {
                const durability = this._Item.getComponent("minecraft:durability")
                JSONDATA.Item.components.push({
                    component: "minecraft:durability",
                    damage: durability.damage
                })
            }
            if (this._Item.hasComponent("minecraft:enchantable")) {
                const enchantable = this._Item.getComponent("minecraft:enchantable")
                JSONDATA.Item.components.push({
                    component: "minecraft:enchantable",
                    enchants: enchantable.getEnchantments()
                })
            }
            if (this._Item.hasComponent("minecraft:dyeable")) {
                const dyeable = this._Item.getComponent("minecraft:dyeable")
                JSONDATA.Item.components.push({
                    component: "minecraft:dyeable",
                    color: dyeable.color
                })
            }
            if (this._Item.hasComponent("minecraft:book")) {
                const book = this._Item.getComponent("minecraft:book")
                JSONDATA.Item.components.push({
                    component: "minecraft:book",
                    author: book.author,
                    rawContents: book.rawContents,
                    title: book.title,
                    isSigned: book.isSigned,
                })
            }
            if (this._Item.hasComponent("minecraft:inventory")) {
                const inventory = this._Item.getComponent("minecraft:inventory")
                let items = []
                for (let i = 0; i < inventory.container.size; i++) {
                    const item = inventory.container.getItem(i)
                    const stringify = new ItemStackJSON(item, i).JSONstringify()
                    items.push(stringify)
                }
                JSONDATA.Item.components.push({
                    component: "minecraft:inventory",
                    items: items
                })
            }
            if (this._Item.hasComponent("minecraft:potion")) {
                const potion = this._Item.getComponent("minecraft:potion")
                JSONDATA.Item.components.push({
                    component: "minecraft:potion",
                    effectType: potion.potionEffectType,
                    liquidType: potion.potionLiquidType,
                    modifierType: potion.potionModifierType,
                })
            }
            system.run(() => {
                JSONDATA.Item.mode.canPlace = this._Item.getCanPlaceOn()
                JSONDATA.Item.mode.canDestroy = this._Item.getCanDestroy()
            })
            return JSON.stringify(JSONDATA);
        }
        else {
            let JSONDATA = {
                Item: {
                    typer: "minecraft:air",
                    nameTag: undefined,
                    amount: 1,
                    dynamicproperties: [],
                    mode: {
                        canPlace: [],
                        canDestroy: []
                    },
                    lore: [],
                    components: [],
                }
            }
            return JSON.stringify(JSONDATA);
        }
    }
    /**
     * 
     * @param {JSON} JSONDATA
     */
    static parse(JSONDATA) {
        const parser = JSON.parse(JSONDATA)
        const parse = parser.Item
        const item = new ItemStack(parse.typer, parse.amount)
        item.nameTag = parse.nameTag
        item.setLore(parse.lore)
        item.setCanDestroy(parse.mode.canDestroy)
        item.setCanPlaceOn(parse.mode.canPlace)
        if (parse.dynamicproperties > 0) {
            parse.dynamicproperties.forEach((dynamic) => {
                item.setDynamicProperty(dynamic.id, dynamic.data)
            })
        }
        for (let k = 0; k < parse.components.length; k++) {
            const component = parse.components[k];
            if (component.component === "minecraft:durability") {
                const durability = item.getComponent("minecraft:durability")
                durability.damage = component.damage
            }
            if (component.component === "minecraft:enchantable") {
                const enchantable = item.getComponent("minecraft:enchantable")
                component.enchants.forEach(e => {
                    enchantable.addEnchantment({ type: new EnchantmentType(`minecraft:${e.type.id}`), level: e.level })
                })
            }
            if (component.component === "minecraft:dyeable") {
                const dyeable = item.getComponent("minecraft:dyeable")
                dyeable.color = component.color
            }
            if (component.component === "minecraft:book") {
                const book = item.getComponent("minecraft:book")
                component.rawContents.forEach((content, i) => {
                    book.setPageContent(i, content)
                })
                book.author = component.author
                book.title = component.title
                if (component.isSigned) book.signBook(component.title, component.author);
            }
            if (component.component === "minecraft:inventory") {
                const inventory = item.getComponent("minecraft:inventory")
                for (let i = 0; i < component.items.length; i++) {
                    inventory.container.setItem(i, ItemStackJSON.parse(component.items[i]))
                }
            }
            if (component.component === "minecraft:potion") {
                const potion = ItemStack.createPotion({
                    effect: component.effectType,
                    liquid: component.liquidType,
                    modifier: component.modifierType
                });
                potion.nameTag = parse.nameTag
                potion.setLore(parse.lore)
                return potion;
            }
        }
        return item;
    }
    /**
     * 
     * @param {JSON} JSONDATA
     * @returns {Item.ItemData}
     */
    static parseObject(JSONDATA) {
        const parser = JSON.parse(JSONDATA)
        return parser;
    }
}

export class globalIds {
    /**
     * 
     * @param {string} DataBase 
     * @param {Object<name: "", id: "">} id 
     */
    constructor(DataBase = "globalId", id = { name: "", id: "" }) {
        this._id = id
        this._DataBase = DataBase
    }
    /**
     * 
     * @returns {Array<string>}
     */
    static getDataBaseIds() {
        const ids = world.getDynamicPropertyIds().filter(id => id.startsWith("save."))
        if (ids.length > 0) {
            return ids
        }
        else return []
    }
    /**
     * 
     * @param {string} playerName 
     * @param {string} DataBase 
     * @returns {boolean}
     */
    static hasId(playerName, DataBase) {
        if (world.getDynamicProperty(`save.${DataBase}`) !== undefined) {
            const data = JSON.parse(world.getDynamicProperty(`save.${DataBase}`))
            if (data.find(n => n.name === playerName)) {
                return true;
            }
            else return false;
        }
        else false;
    }
    /**
     * 
     * @param {string} playerName 
     * @param {string} DataBase 
     * @returns {string | undefined}
     */
    static getId(playerName, DataBase) {
        if (world.getDynamicProperty(`save.${DataBase}`) !== undefined) {
            const data = JSON.parse(world.getDynamicProperty(`save.${DataBase}`))
            if (data.find(n => n.name === playerName)) {
                const i = data.findIndex(n => n.name === playerName)
                return data[i].id;
            }
            else return undefined;
        }
        else undefined;
    }
    /**
     * @param {string} DataBase 
     * @returns {Array<object> | undefined}
     */
    static getDataBase(DataBase) {
        if (world.getDynamicProperty(`save.${DataBase}`) !== undefined) {
            const data = JSON.parse(world.getDynamicProperty(`save.${DataBase}`))
            return data;
        }
        else undefined
    }
    /**
     * 
     * @returns {globalIds}
     */
    static create(DataBase) {
        if (world.getDynamicProperty(`save.${DataBase}`) === undefined) {
            const data = []
            world.setDynamicProperty(`save.${DataBase}`, JSON.stringify(data))
        }
    }
    /**
     * 
     * @returns {boolean}
     */
    isValid() {
        if (world.getDynamicProperty(`save.${this._DataBase}`) === undefined) {
            return false
        }
        else return true
    }
    /**
     * 
     * @returns {Array<object>}
     */
    get() {
        if (this.isValid()) {
            const data = JSON.parse(world.getDynamicProperty(`save.${this._DataBase}`))
            return data;
        }
        else undefined;
    }
    /**
     * 
     * @returns {globalIds}
     */
    create() {
        if (world.getDynamicProperty(`save.${this._DataBase}`) === undefined) {
            const data = []
            world.setDynamicProperty(`save.${this._DataBase}`, JSON.stringify(data))
        }
        return this
    }
    /**
     * 
     * @returns {globalIds}
     */
    delete() {
        if (world.getDynamicProperty(`save.${this._DataBase}`) !== undefined) {
            world.setDynamicProperty(`save.${this._DataBase}`)
        }
        return this
    }
    /**
     * 
     * @returns {globalIds}
     */
    reset() {
        const ids = this.getDataBaseIds()
        if (ids.length > 0) {
            for (let i = 0; i < ids.length; i++) {
                this.delete(ids[i])
            }
        }
        return this
    }
    /**
     * 
     * @param {object} obj 
     * @returns {globalIds}
     */
    save(obj) {
        if (this.isValid()) {
            world.setDynamicProperty(`save.${this._DataBase}`, JSON.stringify(obj))
        }
        return this;
    }
    /**
     * 
     * @returns {globalIds}
     */
    add() {
        if (this.isValid()) {
            const data = this.get()
            if (!data.find(n => n.id === this._id.id)) {
                data.push(this._id)
                this.save(data)
            }
        }
        return this;
    }
    /**
     * 
     * @returns {globalIds}
     */
    remove() {
        if (this.isValid()) {
            const data = this.get()
            if (data.find(n => n.id === this._id.id)) {
                const i = data.findIndex(n => n === this._id.id)
                data.splice(i, 1)
                this.save(data)
            }
        }
        return this;
    }
    /**
     * 
     * @returns {boolean}
     */
    DoesExistId() {
        if (this.isValid()) {
            const data = this.get()
            if (data.find(n => n.id === this._id.id)) {
                return true;
            }
            else return false;
        }
        else false;
    }
    getData() {
        if (this.isValid()) {
            const data = this.get()
            if (data.find(n => n.id === this._id.id)) {
                const i = data.findIndex(n => n.id === this._id.id)
                return data[i];
            }
            else return undefined;
        }
        else undefined;
    }
    /**
     * 
     * @returns {globalIds}
     */
    rename(name) {
        if (this.isValid()) {
            const data = this.get()
            if (data.find(n => n.id === this._id.id)) {
                const i = data.findIndex(n => n.id === this._id.id)
                const sa = {
                    name: name,
                    id: this.id
                }
                data.splice(i, 1, sa)
                this.save(data)
            }
        }
        return this;
    }
    /**
     * @param {object} obj 
     * @returns {globalIds}
     */
    import(obj) {
        if (this.isValid()) {
            this.save(obj)
        }
        return this
    }
    /**
     * 
     * @returns {globalIds}
     */
    export() {
        if (this.isValid()) {
            const data = this.get()
            console.warn(data)
        }
        return this;
    }
    get name() {
        return this._id.name
    }
    get id() {
        return this._id.id
    }
}

export class playersList {
    /**
     * 
     * @param {string} playerName 
     * @param {string} persistentId 
     * @param {Array} playerData 
     */
    constructor(playerName = "", persistentId = "", playerData = null) {
        this._name = playerName
        this._persistentId = persistentId
        this._playerData = []
    }
    static initialize() {
        world.setDynamicProperty("data.playersList", JSON.stringify([]))
        world.setDynamicProperty("data.banList", JSON.stringify([]))
        return this
    }
    static write(obj, type = 0) {
        if (type === 0) world.setDynamicProperty("data.playersList", JSON.stringify(obj))
        if (type === 1) world.setDynamicProperty("data.banList", JSON.stringify(obj))
        return this
    }
    static delete(index, type = 0) {
        if (type === 0) {
            let data = this.getPlayersList()
            data.splice(index, 1)
            this.write(data, type)
        }
        if (type === 1) {
            let data = this.getBanList()
            data.splice(index, 1)
            this.write(data, type)
        }
        return this
    }
    /**
     * 
     * @returns {Array}
     */
    static getPlayersList() {
        return JSON.parse(world.getDynamicProperty("data.playersList"))
    }
    /**
     * 
     * @returns {Array}
     */
    static getBanList() {
        return JSON.parse(world.getDynamicProperty("data.banList"))
    }
    static checkPersistentId(persistentId = "") {
        if (persistentId.length > 0) return true
        else return false
    }
    static getPlayer(persistentId) {
        if (this.checkPersistentId(persistentId)) {
            const data = this.getPlayersList()
            if (data.find(s => s.persistentId === persistentId)) {
                const p = data.find(s => s.persistentId === persistentId)
                return new playersList(p.name, p.persistentId, p.playerData)
            }
            else return undefined
        }
        else return undefined
    }

    static isValid() {
        if (world.getDynamicProperty("data.playersList") === undefined) {
            return false
        }
        else return true
    }

    static getPlayerFromName(name) {
        const data = this.getPlayersList()
        if (data.find(s => s.name === name)) {
            const p = data.find(s => s.name === name)
            return new playersList(p.name, p.persistentId, p.playerData)
        }
        else return undefined
    }

    static DoesExistPlayer(persistentId) {
        const data = this.getPlayersList()
        if (data.length) {
            if (data.find(s => s.persistentId === persistentId)) {
                return true
            }
            else return false
        }
        else return false
    }

    static addPlayer(name, persistentId, playerData = null) {
        if (!this.DoesExistPlayer(persistentId)) {
            const data = this.getPlayersList()
            data.push({ name: name, persistentId: persistentId, playerData: playerData })
            this.write(data)
            return new playersList(name, persistentId, playerData)
        }
        else return undefined
    }
    static getAllPlayers() {
        const datas = this.getPlayersList()
        let ar = []
        for (const p of datas) {
            ar.push(new playersList(p.name, p.persistentId, p.playerData))
        }
        return ar
    }
    static getAllBanPlayers() {
        const datas = this.getBanList()
        let ar = []
        for (const p of datas) {
            ar.push(new playersList(p.name, p.persistentId, p.playerData))
        }
        return ar
    }

    isValid() {
        const data = playersList.getPlayersList()
        if (data.find(s => s.persistentId === this._persistentId)) return true;
        else return false;
    }

    getPlayerData() {
        return this._playerData
    }

    getName() {
        return this._name
    }

    getPersistentId() {
        return this._persistentId
    }

    setPlayerData(playerData = []) {
        let data = playersList.getPlayersList()
        const i = this.getplayersListIndex()
        data[i].playerData = playerData
        playersList.write(data, 0)
        return new playersList(data[i].name, data[i].persistentId, playerData)
    }

    rename(name = "") {
        let data = playersList.getPlayersList()
        const i = this.getplayersListIndex()
        data[i].name = name
        playersList.write(data, 0)
        return new playersList(name, data[i].persistentId, data[i].playerData)
    }

    remove() {
        let data = playersList.getPlayersList()
        const i = this.getplayersListIndex()
        if (this.isValid()) {
            playersList.delete(i, 0)
            return true
        }
        else return false;
    }

    pardon() {
        let data = playersList.getPlayersList()
        if (this.hasBanned()) {
            const i = this.getBanListIndex()
            playersList.delete(i, 1)
            return true;
        }
        else return false;
    }

    ban() {
        let data = playersList.getBanList()
        const i = this.getBanListIndex()
        if (!this.hasBanned()) {
            data.push({ name: this._name, persistentId: this._persistentId, data: [] })
            playersList.write(data, 1)
            return true;
        }
        return false;
    }

    getplayersListIndex() {
        if (this.isValid()) {
            const data = playersList.getPlayersList()
            return data.findIndex(s => s.persistentId === this._persistentId)
        }
    }

    getBanListIndex() {
        const data = playersList.getBanList()
        if (data.length) {
            if (data.find(s => s.persistentId === this._persistentId)) {
                return data.findIndex(s => s.persistentId === this._persistentId)
            }
            else return undefined
        }
        else return undefined
    }

    hasBanned() {
        const data = playersList.getBanList()
        if (data.length) {
            if (data.find(s => s.persistentId === this._persistentId)) {
                return true
            }
            else return false
        }
        else return false
    }
}

export class queue {
    constructor(id) {
        this._id = id
    }
    static create(id) {
        if (!this.isValid(id)) world.setDynamicProperty(`queue.${id}`, JSON.stringify([]))
        return new queue(id)
    }
    /**
     * 
     * @returns {Array}
     */
    static get(id) {
        if (this.isValid(id)) {
            return JSON.parse(world.getDynamicProperty(`queue.${id}`))
        } else return undefined
    }
    static isValid(id) {
        if (world.getDynamicProperty(`queue.${id}`) === undefined) return false
        else return true
    }
    static delete(id) {
        if (this.isValid(id)) {
            world.setDynamicProperty(`queue.${id}`)
        }
        else return undefined;
    }
    /**
     * 
     * @returns {Array}
     */
    get() {
        if (this.isValid(this._id)) {
            return JSON.parse(world.getDynamicProperty(`queue.${this._id}`))
        } else return undefined
    }
    isValid() {
        if (world.getDynamicProperty(`queue.${this._id}`) === undefined) return false
        else return true
    }
    write(obj) {
        if (this.isValid()) {
            let d = this.get()
            world.setDynamicProperty(`queue.${this._id}`, JSON.stringify(obj))
        }
        return this
    }
    has(name) {
        if (this.isValid()) {
            let d = this.get()
            if (d.length) {
                if (d.find(s => s === name)) {
                    return true;
                }
                else return false;
            }
            else return false;
        }
        else return false;
    }
    add(name) {
        if (this.isValid()) {
            let d = this.get()
            if (!this.has(name)) d.push(name)
            this.write(d)
            return this;
        }
    }
    remove(name) {
        if (this.isValid()) {
            let d = this.get()
            if (this.has(name)) {
                if (d.find(s => s === name)) {
                    const i = d.findIndex(s => s === name)
                    d.splice(i, 1)
                    this.write(d)
                    return true;
                }
                else return false;
            }
            else return false;
        }
        else return false;
    }
    list() {
        if (this.isValid()) {
            let d = this.get()
            if (d.length) {
                return d;
            }
            else return [];
        }
        else return [];
    }
}

export class SPlayer {
    /**
     * 
     * @param {Player} SPlayer 
     */
    constructor(SPlayer) {
        this._SPlayer = SPlayer;
    }
    playSoundOpenUI() {
        this._SPlayer.playSound("random.pop2", { pitch: 1.0, volume: 2 })
        return this;
    }

    convert() {
        return this._SPlayer
    }

    pos() {
        return this._SPlayer.location
    }

    fPos() {
        return { x: Math.floor(this._SPlayer.location.x), y: Math.floor(this._SPlayer.location.y), z: Math.floor(this._SPlayer.location.z) }
    }

    getLocalServerData() {
        return new PlayerData(this._SPlayer)
    }
    /**
     * 
     * @param {Function} UI 
     */
    open(UI) {
        return UI(this._SPlayer, true)
    }

    get id() {
        return this._SPlayer.id
    }

    get name() {
        return this._SPlayer.name
    }

    get nameTag() {
        return this._SPlayer.nameTag
    }

    get sender() {
        return this;
    }
}
/**
*
* @param {number} min
* @param {number} max
* @returns {number} ランダムな値を取得
* @example getRandom(0,100)
* // 32.49482936892
*/
export function getRandom(min, max) {
    var random = Math.random() * (max + 1 - min) + min;

    return random;
}
export function getRandomBool() {
    let random;
    if (floorGetRandom(0, 1) === 0) {
        random = false;
    }
    else {
        random = true;
    }
    return random;
}
/**
*
* @param {number} min
* @param {number} max
* @returns {number} ランダムな整数値を取得
* @example getRandom(0,100)
* // 0
*/
export function floorGetRandom(min, max) {
    var random = Math.floor(Math.random() * (max + 1 - min)) + min;

    return random;
}

export class MathEX {
    /**
*
* @param {number} x
* @param {number} y
* @returns {number} 角度を返します
*/
    static calcAngleDegrees(x, y) {
        return (Math.atan2(y, x) * 180) / Math.PI;
    }
    /**
  *
  * @param {number} x 値
  * @returns {number} 階乗の合計値を返します
  * @example factorial(5)
  * // 120
  */
    static factorial(x) {
        let a = 1;
        for (let i = x; i > 1; i--) {
            a = a * i
        }
        return a;
    }
    /**
*
* @param {number} start 最初の値
* @param {number} end この値まで繰り返す
* @param {string} formula 数式
* @returns {number} 総和の値を返します
* @example Math.sum(1, 2, "k")
* // 3
*/
    static sum(start, end, formula) {
        let sum = 0; //合計
        let n = end;
        for (let k = start; k <= n; k++) {
            sum += eval(formula);
        }
        return sum;
    }
    /**
*
* @param {number} start 最初の値
* @param {number} end この値まで繰り返す
* @param {string} formula 数式
* @returns {number} 総積の値を返します
* @example Math.prod(1, 2, "k")
* // 2
*/
    static prod(start, end, formula) {
        let sum = 1; //合計
        let n = end;
        for (let k = start; k <= n; k++) {
            sum *= eval(formula);
        }
        return sum;
    }

    // static Integral(a = 0, b = 1, formula) {
    //     let result = 0
    //     const length = b + 1;
    //     const initial = a;
    //     const diff = 0.001;
    //     const arr = Array.apply(null, new Array(length)).map(function (v, i) { return initial + (i * diff); });
    //     for (let x in arr) {
    //         result += (x**2 + (x**2 + diff)) * diff / 2
    //     }
    //     return result
    // }
}