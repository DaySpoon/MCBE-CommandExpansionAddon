import { BlockLocationIterator, BlockVolume, ButtonState, CommandError, CommandPermissionLevel, CommandResult, CustomCommandError, CustomCommandErrorReason, CustomCommandParamType, CustomCommandSource, CustomCommandStatus, EasingType, Entity, EquipmentSlot, GameMode, GraphicsMode, InputButton, InputMode, ItemStack, ItemType, MemoryTier, MolangVariableMap, PlatformType, Player, PlayerPermissionLevel, RawMessageError, system, world } from "@minecraft/server";
import { globalIds, InventoryManager, SPlayer, floorGetRandom } from "./lib/karageAPI";
import { transferPlayer } from "@minecraft/server-admin";
import { DebugArrow, DebugBox, DebugCircle, debugDrawer, DebugDrawer, DebugLine, DebugShape, DebugSphere, DebugText } from "@minecraft/debug-utilities";
import { LocalKeys } from "./lib/localKeys"
import { LookDuration, SimulatedPlayer, spawnSimulatedPlayer } from "@minecraft/server-gametest"

const allowList = [] //もしjavascriptを実行したいなら、ここに名前追加 + コマンドのPermissionlevel変更

system.beforeEvents.startup.subscribe((data) => {
    const command = data.customCommandRegistry
    command.registerEnum("xs:inventoryOperation", ["write", "load", "change"])
    command.registerEnum("xs:playerData", ["id", "pfid", "pos"])
    command.registerEnum("xs:dimension", ["overworld", "nether", "the_end"])
    command.registerEnum("xs:knokback", ["add", "rotation"])
    command.registerEnum("xs:motion", ["set", "rotation", "pos", "direction", "view_direction"])
    command.registerEnum("xs:velocity", ["clear", "reset"])
    command.registerEnum("xs:cameraOption", ["clear", "set", "facing"])
    command.registerEnum("xs:detectMotion", ["sneak", "swim", "climb", "sprint", "ground", "inwater", "fall", "health", "fly", "glide", "jump", "emote", "valid", "input_jump", "input_sneak", "device", "max_render_distance", "memory_tier", "graphics_mode", "slot", "location", "command_permission_level", "player_permission_level", "dimension", "total_exp", "total_level", "light"])
    command.registerEnum("xs:nameOption", ["reset", "set"])
    command.registerEnum("xs:propertyOption", ["set", "delete"])
    command.registerEnum("xs:fillMode", ["replace"])
    command.registerEnum("xs:shape", ["arrow", "box", "circle", "line", "sphere", "text"])
    command.registerEnum("xs:healthOption", ["set", "reset_default", "reset_min", "reset_max"])
    command.registerEnum("xs:interactType", ["minecraft:place", "minecraft:break", "minecraft:interact_block", "minecraft:interact_entity", "minecraft:attack_entity", "minecraft:pickup", "minecraft:item_use", "minecraft:item_drop", "minecraft:chest_use"])
    command.registerEnum("xs:gamemode", ["survival", "adventure", "creative", "spectator", "default"])
    command.registerEnum("xs:moveOption", ["move", "move_relative"])
    command.registerEnum("xs:moveToLocationOption", ["move_to_block", "move_to_location", "navigate_to_block", "navigate_to_location", "navigate_to_locations", "lookat_block", "interact_block", "break_block"])
    command.registerEnum("xs:entityOption", ["navigate_to_entity", "attack_entity", "interact_entity", "lookat_entity"])
    command.registerEnum("xs:stopOption", ["breaking_block", "build", "interacting", "flying", "gliding", "moving", "swimming", "using_item", "sneaking"])
    command.registerEnum("xs:startOption", ["build", "jump", "sneak", "interact", "fly", "glide", "swim", "use_item_in_slot", "use_item_in_slot_on_block", "respawn"])
    command.registerEnum("xs:weaponSlot", ["mainhand", "offhand", "head", "feet", "chest", "legs", "full_armor"])

    command.registerCommand({
        name: "xs:clearchat",
        description: "チャットをクリアします",
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: []
    }, (origin, datas) => {
        const entity = origin.sourceEntity
        if (entity instanceof Player) {
            for (let i = 0; i < 100; i++) {
                entity.sendMessage("")
            }
        }
        return {
            status: CustomCommandStatus.Success,
        };
    })

    command.registerCommand({
        name: "xs:inventory",
        description: "インベントリを保存,読み込みします",
        permissionLevel: CommandPermissionLevel.Host,
        mandatoryParameters: [{ name: "player", type: CustomCommandParamType.PlayerSelector }, { name: "xs:inventoryOperation", type: CustomCommandParamType.Enum }]
    }, (origin, selectors, param) => {
        if (param === "write" || param === "load" || param === "change") {
            for (const selector of selectors) {
                const inventory = selector.getComponent("inventory")
                const inv = new InventoryManager({ target: selector, InventoryComponent: inventory })
                if (param === "write") {
                    inv.save()
                }
                else if (param === "load") {
                    inv.load()
                }
                else if (param === "change") {
                    inv.changeInventory()
                }
            }
            if (param === "write") return {
                status: CustomCommandStatus.Success,
                message: `${display(selectors, 10)}のインベントリデータを保存しました`
            };
            else if (param === "load") return {
                status: CustomCommandStatus.Success,
                message: `${display(selectors, 10)}のインベントリデータを読み込みしました`
            };
            else if (param === "change") return {
                status: CustomCommandStatus.Success,
                message: `${display(selectors, 10)}のインベントリデータを書き換えしました`
            };
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: "引数が存在しません"
        }
    })

    command.registerCommand({
        name: "xs:placer",
        description: "空中にブロックを設置します",
        permissionLevel: CommandPermissionLevel.Host,
        optionalParameters: [{ name: "position", type: CustomCommandParamType.Location }, { name: "breakTime", type: CustomCommandParamType.Float }],
        mandatoryParameters: []
    }, (origin, location, time) => {
        const entity = origin.sourceEntity
        if (entity instanceof Player) {
            if (location !== undefined) {
                if (time !== undefined) {
                    system.run(() => {
                        entity.dimension.setBlockType(location, "glass")
                    })
                    system.runTimeout(() => {
                        entity.dimension.setBlockType(location, "air")
                    }, time * 20)
                    return {
                        status: CustomCommandStatus.Success,
                        message: `ブロックを設置しました`
                    }
                }
                else {
                    system.run(() => {
                        entity.dimension.setBlockType(location, "glass")
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `ブロックを設置しました`
                    }
                }
            }
            else if (location === undefined) {
                system.run(() => {
                    entity.dimension.setBlockType(new SPlayer(entity).fPos(), "glass")
                })
                return {
                    status: CustomCommandStatus.Success,
                    message: `ブロックを設置しました`
                }
            }
            else return {
                status: CustomCommandStatus.Failure
            }
        }
        else return {
            status: CustomCommandStatus.Failure
        }
    })

    command.registerCommand({
        name: "xs:swap",
        description: "指定プレイヤー同士の位置を入れ替えます",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "player", type: CustomCommandParamType.PlayerSelector }, { name: "otherTarget", type: CustomCommandParamType.PlayerSelector }]
    }, (origin, target, otherTargets) => {
        let otherTarget = otherTargets.concat()
        let duplicate = 0;
        if (target.length && otherTargets.length) {
            for (const player of target) {
                let targetlist = otherTarget.concat()
                if (targetlist.find(s => s.id === player.id)) {
                    const i = targetlist.findIndex(s => s.id === player.id)
                    targetlist.splice(i, 1)
                    duplicate++;
                }
                if (targetlist.length > 0) {
                    const ind = floorGetRandom(0, targetlist.length - 1)
                    const targeter = targetlist[ind]

                    system.run(() => {
                        const loc = player.location
                        const loc2 = targeter.location
                        const h2 = targeter.getRotation()
                        const h = player.getRotation()
                        player.teleport(loc2, { rotation: h2 })
                        targeter.teleport(loc, { rotation: h })
                    })
                    const i = otherTarget.findIndex(s => s.id === targeter.id)
                    otherTarget.splice(i, 1)
                }
                else break;
            }
            return {
                status: CustomCommandStatus.Success,
                message: `${display(target, 10)}と ${display(otherTargets, 10, "人", duplicate)}の位置を入れ替えました`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のプレイヤーが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:announce",
        description: "アナウンスします",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "message", type: CustomCommandParamType.String }]
    }, (origin, message) => {
        world.sendMessage(`§a§l[サーバー]§r ${message}`)
        return {
            status: CustomCommandStatus.Success,
            message: `ワールドにアナウンスしました`
        }
    })

    command.registerCommand({
        name: "xs:get",
        description: "指定プレイヤーの情報を取得します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "player", type: CustomCommandParamType.PlayerSelector }, { name: "xs:playerData", type: CustomCommandParamType.Enum }]
    }, (origin, target, param) => {
        if (target.length === 1) {
            if (param === "id" || param === "pfid" || param === "pos") {
                if (param === "id") {
                    let list = []
                    for (const player of target) {
                        list.push(`${player.name.length <= 25 ? player.name : `${player.name.slice(0, 25)}...(省略)`} => ${player.id}`)
                    }
                    if (origin.sourceEntity instanceof Player) {
                        origin.sourceEntity.sendMessage(`${list.join("\n")}`)
                    }
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(target, 10)}のidを取得しました`
                    }
                }
                if (param === "pfid") {
                    if (globalIds.getDataBase("globalId") !== undefined) {
                        const dat = globalIds.getDataBase("globalId")
                        if (globalIds.hasId(target[0].name, "globalId")) {
                            const gl = globalIds.getId(target[0].name, "globalId")
                            if (origin.sourceEntity instanceof Player) {
                                origin.sourceEntity.sendMessage(`${target[0].name}のpfid: ${gl}§r`)
                            }
                            return {
                                status: CustomCommandStatus.Success,
                                message: `${target[0].name} のpfidを取得しました`
                            }
                        }
                        else return {
                            status: CustomCommandStatus.Failure,
                            message: `そのプレイヤーはglobalIdリストに登録されていません`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `globalIdリストが見つかりませんでした`
                    }
                }
                if (param === "pos") {
                    if (origin.sourceEntity instanceof Player) {
                        origin.sourceEntity.sendMessage(`${target[0].name}の座標: ${Math.floor(target[0].location.x)} ${Math.floor(target[0].location.y)} ${Math.floor(target[0].location.z)} (${target[0].dimension.id})§r`)
                    }
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${target[0].name} の座標を取得しました`
                    }
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else if (target.length > 1) {
            return {
                status: CustomCommandStatus.Failure,
                message: `複数指定は無効です`
            }
        }
        else {
            return {
                status: CustomCommandStatus.Failure,
                message: `対象が存在しません`
            }
        }
    })

    command.registerCommand({
        name: "xs:dimensiontp",
        description: "ディメンション間をテレポートします",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "destination", type: CustomCommandParamType.Location }, { name: "xs:dimension", type: CustomCommandParamType.Enum }],
        optionalParameters: [{ name: "checkForBlocks", type: CustomCommandParamType.Boolean }, { name: "keepVelocity", type: CustomCommandParamType.Boolean }, { name: "yRot", type: CustomCommandParamType.Float }, { name: "xRot", type: CustomCommandParamType.Float }]
    }, (origin, targets, location, dimension, checkForBlocks, keepVelocity, yRot, xRot) => {
        if (targets.length) {
            if (dimension === "overworld" || dimension === "nether" || dimension === "the_end") {
                try {
                    system.run(() => {
                        for (const entity of targets) {
                            if (entity instanceof Entity) {
                                if (xRot !== undefined && yRot !== undefined) {
                                    entity.teleport(location, {
                                        dimension: world.getDimension(dimension),
                                        checkForBlocks: checkForBlocks === undefined ? false : checkForBlocks,
                                        keepVelocity: entity.typeId !== "minecraft:player" ? (keepVelocity === undefined ? false : keepVelocity) : false,
                                        rotation: { x: xRot, y: yRot }
                                    })
                                }
                                else {
                                    entity.teleport(location, {
                                        dimension: world.getDimension(dimension),
                                        checkForBlocks: checkForBlocks === undefined ? false : checkForBlocks,
                                        keepVelocity: entity.typeId !== "minecraft:player" ? (keepVelocity === undefined ? false : keepVelocity) : false
                                    })
                                }
                            }
                        }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}を ${dimension} (${location.x} ${location.y} ${location.z}) にテレポートさせました`
                    }
                } catch (e) {
                    return {
                        status: CustomCommandStatus.Failure,
                        message: `正常にエンティティをテレポートさせることができませんでした`
                    }
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:transfers",
        description: "指定したプレイヤーを指定サーバーに転送します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "player", type: CustomCommandParamType.PlayerSelector }, { name: "hostname", type: CustomCommandParamType.String }, { name: "port", type: CustomCommandParamType.Integer }],
        optionalParameters: [{ name: "showMessage", type: CustomCommandParamType.Boolean }]
    }, (origin, targets, hostname, port, showMessage) => {
        if (targets.length) {
            for (const player of targets) {
                if (player instanceof Player) {
                    system.run(() => {
                        transferPlayer(player, { hostname: hostname, port: port })
                    })
                }
            }
            if (typeof showMessage === "boolean") {
                if (showMessage) {
                    world.sendMessage(`§t§l[転送] §r${display(targets, 10)}が§a${hostname}§rに転送されました`)
                }
            }
            return {
                status: CustomCommandStatus.Success,
                message: `${display(targets, 10)}の転送に成功しました (転送先: ${hostname}, ポート番号: ${port})`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のプレイヤーが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:knokback",
        description: "対象をノックバックさせます",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "xs:knokback", type: CustomCommandParamType.Enum },
        { name: "x", type: CustomCommandParamType.Float },
        { name: "z", type: CustomCommandParamType.Float },
        { name: "w", type: CustomCommandParamType.Float }],
        optionalParameters: []
    }, (origin, targets, param, xr, zr, wr) => {
        if (param === "add" || param === "rotation") {
            if (targets.length) {
                system.run(() => {
                    try {
                        for (const entity of targets) {
                            if (entity instanceof Entity) {
                                if (param === "add") {
                                    entity.applyKnockback({ x: xr, z: zr }, wr)
                                }
                                if (param === "rotation") {
                                    const { x, y, z } = entity.getViewDirection()
                                    entity.applyKnockback({ x: xr * x, z: zr * z }, wr)
                                }
                            }
                        }
                    } catch (e) { }
                })
                return {
                    status: CustomCommandStatus.Success,
                    message: `${display(targets, 10, "体")}のエンティティをノックバックさせました`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `対象のエンティティが存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `引数が存在しません`
        }
    })

    command.registerCommand({
        name: "xs:motion",
        description: "対象に力積を適用します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "xs:motion", type: CustomCommandParamType.Enum },
        { name: "x", type: CustomCommandParamType.Float },
        { name: "y", type: CustomCommandParamType.Float },
        { name: "z", type: CustomCommandParamType.Float }],
        optionalParameters: [{ name: "directionEntity", type: CustomCommandParamType.EntitySelector }]
    }, (origin, targets, param, xr, yr, zr, entities) => {
        if (param === "set" || param === "rotation" || param === "pos" || param === "direction" || param === "view_direction") {
            if (targets.length) {
                try {
                    system.run(() => {
                        for (const entity of targets) {
                            if (entity instanceof Entity) {
                                if (param === "set") {

                                    entity.applyImpulse({ x: xr, y: yr, z: zr })
                                }
                                if (param === "rotation") {
                                    const { x, y, z } = entity.getViewDirection()
                                    if (entities !== undefined) {
                                        for (const ent of entities) {
                                            const { x: x2, y: y2, z: z2 } = ent.getViewDirection()
                                            entity.applyImpulse({ x: xr * (-x2), y: yr + y, z: zr * (-z2) })
                                        }
                                    }
                                    else entity.applyImpulse({ x: xr * x, y: yr * y, z: zr * z })
                                }
                                if (param === "pos") {
                                    entity.applyImpulse({ x: 1 / 5 * (xr - entity.location.x), y: 1 / 5 * (yr - entity.location.y), z: 1 / 5 * (zr - entity.location.z) })
                                }
                                if (param === "direction") {
                                    if (entities.length) {
                                        const { x: x2, y: y2, z: z2 } = entity.location
                                        for (const ent of entities) {
                                            const { x, y, z } = ent.location
                                            entity.applyImpulse({ x: ((x - x2) / 2) * xr, y: (((y - 2) - y2) / 4) - yr, z: ((z - z2) / 2) * zr })
                                        }
                                    }
                                    else return {
                                        status: CustomCommandStatus.Failure,
                                        message: `対象のエンティティが存在しません`
                                    }
                                }
                                if (param === "view_direction") {
                                    if (entities.length) {
                                        const { x: x2, y: y2, z: z2 } = entity.location
                                        for (const ent of entities) {
                                            const { x, y, z } = ent.location
                                            const { x: vx, y: vy, z: vz } = ent.getViewDirection()
                                            entity.applyImpulse({ x: Math.floor(x2 - x) * xr, y: Math.floor(y2 - y) * yr, z: Math.floor(z2 - z) * zr })
                                        }
                                    }
                                    else return {
                                        status: CustomCommandStatus.Failure,
                                        message: `対象のエンティティが存在しません`
                                    }
                                }
                            }
                        }
                    })
                } catch (e) { }
                return {
                    status: CustomCommandStatus.Success,
                    message: `${display(targets, 10, "体")}のエンティティに力積を適用しました`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `対象のエンティティが存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `引数が存在しません`
        }
    })

    command.registerCommand({
        name: "xs:velocity",
        description: "対象の速度をコントロールします",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "xs:velocity", type: CustomCommandParamType.Enum }],
        optionalParameters: []
    }, (origin, targets, param) => {
        if (targets.length) {
            if (param === "clear") {
                system.run(() => {
                    for (const entity of targets) {
                        if (entity instanceof Entity) {
                            entity.clearVelocity()
                        }
                    }
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}のエンティティの速度を変更しました`
                    }
                })
            }
            else if (param === "reset") {
                system.run(() => {
                    for (const entity of targets) {
                        if (entity instanceof Entity) {
                            entity.applyKnockback({ x: 0, z: 0 }, 0)
                        }
                    }
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}のエンティティの速度を変更しました`
                    }
                })
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:ac-ban",
        description: "プレイヤーのアカウントのアクセスを禁止,解除します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "name | id | list", type: CustomCommandParamType.String }],
        optionalParameters: []
    }, (origin, target) => {
        const sender = origin.sourceEntity
        if (sender instanceof Player) {
            if (!isNaN(target)) {
                if (world.getPlayers().find(p => p.id === target)) {
                    const player = world.getPlayers().find(p => p.id === target)
                    const id = globalIds.getId(player.name, "globalId")
                    if (id !== undefined) {
                        const data = new globalIds("globalId", { name: player.name, id: id })
                        const bandata = new globalIds("banId", { name: player.name, id: id })
                        if (!bandata.DoesExistId()) {
                            if (player.playerPermissionLevel !== PlayerPermissionLevel.Operator) {
                                bandata.add()
                                system.run(() => {
                                    player.runCommand(`kick @s "§qaccount ban >> §c貴方はアクセスが禁止されました。"`)
                                })
                                return {
                                    status: CustomCommandStatus.Success,
                                    message: `${player.name} のアクセスを禁止しました`
                                }
                            }
                            else return {
                                status: CustomCommandStatus.Failure,
                                message: `権限があるプレイヤーはbanできません`
                            }
                        }
                        else {
                            bandata.remove()
                            return {
                                status: CustomCommandStatus.Success,
                                message: `${target} のアクセス禁止を解除しました`
                            }
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `そのプレイヤーはglobalIdリストに登録されていません`
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `ワールド内にそのidを持つプレイヤーがいません`
                }
            }
            else {
                if (target === "list") {
                    const ids = globalIds.getDataBase("banId")
                    let list = []
                    if (ids.length) {
                        ids.forEach(id => {
                            list.push(`- ${id.name} : ${id.id}`)
                        })
                        return {
                            status: CustomCommandStatus.Success,
                            message: `banされたプレイヤー: (${list.length}件)\n ${list.join("\n")}`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Success,
                        message: `banされたプレイヤー: (0件)`
                    }
                }
                else {
                    const id = globalIds.getId(target, "globalId")
                    if (id !== undefined) {
                        const data = new globalIds("globalId", { name: target, id: id })
                        const bandata = new globalIds("banId", { name: target, id: id })
                        if (!bandata.DoesExistId()) {
                            bandata.add()
                            if (world.getPlayers().find(s => s.name === target)) {
                                const player = world.getPlayers().find(s => s.name === target)
                                system.run(() => {
                                    player.runCommand(`kick @s "§qaccount ban >> §c貴方はアクセスが禁止されました。"`)
                                })
                            }
                            return {
                                status: CustomCommandStatus.Success,
                                message: `${target} のアクセスを禁止しました`
                            }
                        }
                        else {
                            bandata.remove()
                            return {
                                status: CustomCommandStatus.Success,
                                message: `${target} のアクセス禁止を解除しました`
                            }
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `そのプレイヤーはglobalIdリストに登録されていません`
                    }
                }
            }
        }
        if (origin.sourceType === CustomCommandSource.Server) {
            if (!isNaN(target)) {
                if (world.getPlayers().find(p => p.id === target)) {
                    const player = world.getPlayers().find(p => p.id === target)
                    const id = globalIds.getId(player.name, "globalId")
                    if (id !== undefined) {
                        const data = new globalIds("globalId", { name: player.name, id: id })
                        const bandata = new globalIds("banId", { name: player.name, id: id })
                        if (!bandata.DoesExistId()) {
                            if (player.playerPermissionLevel !== PlayerPermissionLevel.Operator) {
                                bandata.add()
                                system.run(() => {
                                    player.runCommand(`kick @s "§qaccount ban >> §c貴方はアクセスが禁止されました。"`)
                                })
                                return {
                                    status: CustomCommandStatus.Success,
                                    message: `${player.name} のアクセスを禁止しました`
                                }
                            }
                            else return {
                                status: CustomCommandStatus.Failure,
                                message: `権限があるプレイヤーはbanできません`
                            }
                        }
                        else {
                            bandata.remove()
                            return {
                                status: CustomCommandStatus.Success,
                                message: `${target} のアクセス禁止を解除しました`
                            }
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `そのプレイヤーはglobalIdリストに登録されていません`
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `ワールド内にそのidを持つプレイヤーがいません`
                }
            }
            else {
                const id = globalIds.getId(target, "globalId")
                if (id !== undefined) {
                    const data = new globalIds("globalId", { name: target, id: id })
                    const bandata = new globalIds("banId", { name: target, id: id })
                    if (!bandata.DoesExistId()) {
                        bandata.add()
                        if (world.getPlayers().find(s => s.name === target)) {
                            const player = world.getPlayers().find(s => s.name === target)
                            system.run(() => {
                                player.runCommand(`kick @s "§qaccount ban >> §c貴方はアクセスが禁止されました。"`)
                            })
                        }
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${target} のアクセスを禁止しました`
                        }
                    }
                    else {
                        bandata.remove()
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${target} のアクセス禁止を解除しました`
                        }
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `そのプレイヤーはglobalIdリストに登録されていません`
                }
            }
        }
    })

    command.registerCommand({
        name: "xs:ban",
        description: "プレイヤーのアクセスを禁止します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "name | id | list", type: CustomCommandParamType.String }],
        optionalParameters: []
    }, (origin, target) => {
        const sender = origin.sourceEntity
        if (sender instanceof Player) {
            if (!isNaN(target)) {
                if (world.getPlayers().find(p => p.id === target)) {
                    const player = world.getPlayers().find(p => p.id === target)
                    const bandata = new globalIds("nbanId", { name: player.name, id: player.id })
                    if (!bandata.DoesExistId()) {
                        if (player.playerPermissionLevel !== PlayerPermissionLevel.Operator) {
                            bandata.add()
                            system.run(() => {
                                player.runCommand(`kick @s "§eban >> §c貴方はアクセスが禁止されました。"`)
                            })
                            return {
                                status: CustomCommandStatus.Success,
                                message: `${player.name} のアクセスを禁止しました`
                            }
                        }
                        else return {
                            status: CustomCommandStatus.Failure,
                            message: `権限があるプレイヤーはbanできません`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `既にそのプレイヤーはアクセスが禁止されています`
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `ワールド内にそのidを持つプレイヤーがいません`
                }
            }
            else {
                if (target === "list") {
                    const ids = globalIds.getDataBase("nbanId")
                    let list = []
                    if (ids.length) {
                        ids.forEach(id => {
                            list.push(`- ${id.name} : ${id.id}`)
                        })
                        return {
                            status: CustomCommandStatus.Success,
                            message: `banされたプレイヤー: (${list.length}件)\n ${list.join("\n")}`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Success,
                        message: `banされたプレイヤー: (0件)`
                    }
                }
                else {
                    const id = globalIds.getId(target, "playerData")
                    if (id !== undefined) {
                        const bandata = new globalIds("nbanId", { name: target, id: id })
                        if (!bandata.DoesExistId()) {
                            bandata.add()
                            if (world.getPlayers().find(s => s.name === target)) {
                                const player = world.getPlayers().find(s => s.name === target)
                                system.run(() => {
                                    player.runCommand(`kick @s "§eban >> §c貴方はアクセスが禁止されました。"`)
                                })
                            }
                            return {
                                status: CustomCommandStatus.Success,
                                message: `${target} のアクセスを禁止しました`
                            }
                        }
                        else return {
                            status: CustomCommandStatus.Failure,
                            message: `既にそのプレイヤーはアクセスが禁止されています`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `そのプレイヤーは記録されていません`
                    }
                }
            }
        }
        if (origin.sourceType === CustomCommandSource.Server) {
            if (!isNaN(target)) {
                if (world.getPlayers().find(p => p.id === target)) {
                    const player = world.getPlayers().find(p => p.id === target)
                    const bandata = new globalIds("nbanId", { name: player.name, id: player.id })
                    if (!bandata.DoesExistId()) {
                        if (player.playerPermissionLevel !== PlayerPermissionLevel.Operator) {
                            bandata.add()
                            system.run(() => {
                                player.runCommand(`kick @s "§eban >> §c貴方はアクセスが禁止されました。"`)
                            })
                            return {
                                status: CustomCommandStatus.Success,
                                message: `${player.name} のアクセスを禁止しました`
                            }
                        }
                        else return {
                            status: CustomCommandStatus.Failure,
                            message: `権限があるプレイヤーはbanできません`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `既にそのプレイヤーはアクセスが禁止されています`
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `ワールド内にそのidを持つプレイヤーがいません`
                }
            }
            else {
                const id = globalIds.getId(target, "playerData")
                if (id !== undefined) {
                    const bandata = new globalIds("banId", { name: target, id: id })
                    if (!bandata.DoesExistId()) {
                        bandata.add()
                        if (world.getPlayers().find(s => s.name === target)) {
                            const player = world.getPlayers().find(s => s.name === target)
                            system.run(() => {
                                player.runCommand(`kick @s "§eban >> §c貴方はアクセスが禁止されました。"`)
                            })
                        }
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${target} のアクセスを禁止しました`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `既にそのプレイヤーはアクセスが禁止されています`
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `そのプレイヤーは記録されていません`
                }
            }
        }
    })

    command.registerCommand({
        name: "xs:unban",
        description: "プレイヤーのアクセスの禁止を解除します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "name", type: CustomCommandParamType.String }],
        optionalParameters: []
    }, (origin, target) => {
        const sender = origin.sourceEntity
        if (sender instanceof Player) {
            if (isNaN(target)) {
                const id = globalIds.getId(target, "playerData")
                if (id !== undefined) {
                    const bandata = new globalIds("nbanId", { name: target, id: id })
                    if (!bandata.DoesExistId()) {
                        return {
                            status: CustomCommandStatus.Failure,
                            message: `そのプレイヤーは既に解除されたか、banされていません`
                        }
                    }
                    else {
                        bandata.remove()
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${target} のアクセス禁止を解除しました`
                        }
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `そのプレイヤーは記録されていません`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `idの入力は無効です`
            }
        }
        if (origin.sourceType === CustomCommandSource.Server) {
            if (isNaN(target)) {
                const id = globalIds.getId(target, "playerData")
                if (id !== undefined) {
                    const bandata = new globalIds("nbanId", { name: target, id: id })
                    if (!bandata.DoesExistId()) {
                        return {
                            status: CustomCommandStatus.Failure,
                            message: `そのプレイヤーは既に解除されたか、banされていません`
                        }
                    }
                    else {
                        bandata.remove()
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${target} のアクセス禁止を解除しました`
                        }
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `そのプレイヤーは記録されていません`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `idの入力は無効です`
            }
        }
    })

    command.registerCommand({
        name: "xs:fire",
        description: "延焼ダメージを与えます",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "duration", type: CustomCommandParamType.Float }],
        optionalParameters: [{ name: "effect", type: CustomCommandParamType.Boolean }]
    }, (origin, targets, duration, effect) => {
        const entity = origin.sourceEntity
        if (targets.length) {
            system.run(() => {
                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i]
                    target.setOnFire(duration, typeof effect === "boolean" ? effect : false)
                }
            })
            return {
                status: CustomCommandStatus.Success,
                message: `${display(targets, 10, "体")}に延焼ダメージを与えました`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:extinguishfire",
        description: "消火します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }],
        optionalParameters: [{ name: "effect", type: CustomCommandParamType.Boolean }]
    }, (origin, targets, effect) => {
        const entity = origin.sourceEntity
        if (targets.length) {
            system.run(() => {
                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i]
                    target.extinguishFire(typeof effect === "boolean" ? effect : false)
                }
            })
            return {
                status: CustomCommandStatus.Success,
                message: `${display(targets, 10, "体")}を消火しました`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:wall",
        description: "指定した領域を壁で囲います",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "from", type: CustomCommandParamType.Location }, { name: "to", type: CustomCommandParamType.Location }, { name: "tileName", type: CustomCommandParamType.BlockType }],
        optionalParameters: [{ name: "xs:fillMode", type: CustomCommandParamType.Enum }, { name: "modeTileName", type: CustomCommandParamType.BlockType }]
    }, (origin, from, to, tile, mode, tile2) => {
        const limit = 32767
        const sd = origin.sourceType === CustomCommandSource.Block ? origin.sourceBlock : origin.sourceType === CustomCommandSource.Entity ? origin.sourceEntity : origin.sourceType === CustomCommandSource.NPCDialogue ? origin.initiator : undefined
        const poses = [
            from,
            to,
            { x: to.x, y: from.y, z: from.z },
            { x: from.x, y: from.y, z: to.z }
        ]
        const poser = [
            { x: to.x, y: to.y, z: from.z },
            { x: from.x, y: to.y, z: to.z },
            { x: from.x, y: to.y, z: from.z }
        ]
        if (mode === undefined) {
            if (sd !== undefined) {
                let sum = 0;
                const dim = sd.dimension
                const volume = new BlockVolume(poses[0], poser[0])
                const volume2 = new BlockVolume(poses[0], poser[1])
                const volume3 = new BlockVolume(poses[1], poses[2])
                const volume4 = new BlockVolume(poses[1], poses[3])
                sum = volume.getCapacity() + volume2.getCapacity() + volume3.getCapacity() + volume4.getCapacity()
                if (sum <= limit) {
                    system.run(() => {
                        dim.fillBlocks(volume, `${tile.id}`)
                        dim.fillBlocks(volume2, `${tile.id}`)
                        dim.fillBlocks(volume3, `${tile.id}`)
                        dim.fillBlocks(volume4, `${tile.id}`)
                    })
                    if (sum > 0) {
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${sum} 個のブロックで満たしました`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `${sum} 個のブロックで満たしました`
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `指定したブロックの数が多すぎます (${sum} > ${limit})`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `サーバーから実行できません`
            }
        }
        else if (mode === "replace") {
            if (sd !== undefined) {
                let sum = 0;
                const dim = sd.dimension
                const volume = new BlockVolume(poses[0], poser[0])
                const volume2 = new BlockVolume(poses[0], poser[1])
                const volume3 = new BlockVolume(poses[1], poses[2])
                const volume4 = new BlockVolume(poses[1], poses[3])
                sum = volume.getCapacity() + volume2.getCapacity() + volume3.getCapacity() + volume4.getCapacity()
                if (sum <= limit) {
                    system.run(() => {
                        dim.fillBlocks(volume, `${tile.id}`, { blockFilter: { includeTypes: [`${tile2.id}`] } })
                        dim.fillBlocks(volume2, `${tile.id}`, { blockFilter: { includeTypes: [`${tile2.id}`] } })
                        dim.fillBlocks(volume3, `${tile.id}`, { blockFilter: { includeTypes: [`${tile2.id}`] } })
                        dim.fillBlocks(volume4, `${tile.id}`, { blockFilter: { includeTypes: [`${tile2.id}`] } })
                    })
                    if (sum > 0) {
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${sum} 個のブロックで満たしました`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `${sum} 個のブロックで満たしました`
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `指定したブロックの数が多すぎます (${sum} > ${limit})`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `サーバーから実行できません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `引数が存在しません`
        }
    })

    command.registerCommand({
        name: "xs:draw",
        description: "線、図形を描画します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "xs:shape", type: CustomCommandParamType.Enum }, { name: "xs:from", type: CustomCommandParamType.Location }, { name: "xs:to", type: CustomCommandParamType.Location }],
        optionalParameters: [{ name: "xs:RGB", type: CustomCommandParamType.Location }, { name: "xs:timeleft", type: CustomCommandParamType.Float }, { name: "xs:scale|text", type: CustomCommandParamType.String }, { name: "xs:rotation", type: CustomCommandParamType.Location }]
    }, (origin, mode, from, to, rgb, timeleft, text, rotation) => {
        if (mode === "arrow" || mode === "box" || mode === "circle" || mode === "line" || mode === "sphere" || mode === "text") {
            let color = false;
            if (rgb === undefined) {
                color = false;
            }
            else if (rgb.x - 0.5 >= 0 && rgb.x - 0.5 <= 1 && rgb.y >= 0 && rgb.y <= 1 && rgb.z - 0.5 >= 0 && rgb.z - 0.5 <= 1) {
                color = true;
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `RGBの値は0から1までの値でないといけません`
            }
            if (mode === "arrow") {
                const draw = new DebugArrow(from, to)
                if (color) draw.color = { red: rgb.x - 0.5, green: rgb.y, blue: rgb.z - 0.5 };
                draw.timeLeft = timeleft === undefined || timeleft < 0 ? undefined : timeleft;
                draw.scale = !isNaN(text) ? Number(text) : 1
                if (rotation !== undefined) draw.rotation = rotation
                debugDrawer.addShape(draw);
            }
            else if (mode === "box") {
                const draw = new DebugBox(from)
                if (color) draw.color = { red: rgb.x - 0.5, green: rgb.y, blue: rgb.z - 0.5 };
                draw.timeLeft = timeleft === undefined || timeleft < 0 ? undefined : timeleft;
                draw.scale = !isNaN(text) ? Number(text) : 1
                if (rotation !== undefined) draw.rotation = rotation
                debugDrawer.addShape(draw);
            }
            else if (mode === "circle") {
                const draw = new DebugCircle(from)
                if (color) draw.color = { red: rgb.x - 0.5, green: rgb.y, blue: rgb.z - 0.5 };
                draw.timeLeft = timeleft === undefined || timeleft < 0 ? undefined : timeleft;
                draw.scale = !isNaN(text) ? Number(text) : 1
                if (rotation !== undefined) draw.rotation = rotation
                debugDrawer.addShape(draw);
            }
            else if (mode === "line") {
                const draw = new DebugLine(from, to)
                if (color) draw.color = { red: rgb.x - 0.5, green: rgb.y, blue: rgb.z - 0.5 };
                draw.timeLeft = timeleft === undefined || timeleft < 0 ? undefined : timeleft;
                draw.scale = !isNaN(text) ? Number(text) : 1
                if (rotation !== undefined) draw.rotation = rotation
                debugDrawer.addShape(draw);
            }
            else if (mode === "sphere") {
                const draw = new DebugSphere(from)
                if (color) draw.color = { red: rgb.x - 0.5, green: rgb.y, blue: rgb.z - 0.5 };
                draw.timeLeft = timeleft === undefined || timeleft < 0 ? undefined : timeleft;
                draw.scale = !isNaN(text) ? Number(text) : 1
                if (rotation !== undefined) draw.rotation = rotation
                debugDrawer.addShape(draw);
            }
            else if (mode === "text") {
                const draw = new DebugText(from, text !== undefined ? text.split(":").length > 1 ? text.split(":")[1] : text : "")
                if (color) draw.color = { red: rgb.x - 0.5, green: rgb.y, blue: rgb.z - 0.5 };
                draw.timeLeft = timeleft === undefined || timeleft < 0 ? undefined : timeleft;
                if (text !== undefined) {
                    const tex = text.split(":")
                    if (tex.length > 1) draw.scale = !isNaN(tex[0]) ? Number(tex[0]) : 1
                    else draw.scale = 1;
                }
                if (rotation !== undefined) draw.rotation = rotation
                debugDrawer.addShape(draw);
            }
            return {
                status: CustomCommandStatus.Success,
                message: `${mode} を生成しました`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `引数が存在しません`
        }
    })

    command.registerCommand({
        name: "xs:cleardraw",
        description: "線、図形をクリアします",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [],
        optionalParameters: [{ name: "xs:closest", type: CustomCommandParamType.Boolean }]
    }, (origin, closest) => {
        debugDrawer.removeAll()
        return {
            status: CustomCommandStatus.Success,
            message: `図形の描画を全てクリアしました`
        }
    })

    command.registerCommand({
        name: "xs:despawn",
        description: "デスポーンさせます",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }],
        optionalParameters: []
    }, (origin, targets, duration, effect) => {
        const entity = origin.sourceEntity
        if (targets.length) {
            system.run(() => {
                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i]
                    if (target.typeId !== "minecraft:player") target.remove()
                }
            })
            return {
                status: CustomCommandStatus.Success,
                message: `${display(targets, 10, "体")}をデスポーンさせました`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:client-particle",
        description: "対象のみにパーティクルを表示します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "player", type: CustomCommandParamType.PlayerSelector }, { name: "effect", type: CustomCommandParamType.String }],
        optionalParameters: [{ name: "position", type: CustomCommandParamType.Location },
        { name: "valiableName", type: CustomCommandParamType.String },
        { name: "R", type: CustomCommandParamType.Float },
        { name: "G", type: CustomCommandParamType.Float },
        { name: "B", type: CustomCommandParamType.Float },
        { name: "A", type: CustomCommandParamType.Float }]
    }, (origin, targets, effect, position, valiableName, R, G, B, A) => {
        const entity = origin.sourceEntity
        const molang = new MolangVariableMap()
        if (targets.length) {
            if (valiableName !== undefined && R !== undefined && G !== undefined && B !== undefined && A !== undefined) {
                if (R <= 1 && R >= 0 && G <= 1 && G >= 0 && B <= 1 && B >= 0 && A <= 1 && A >= 0) {
                    molang.setColorRGBA(valiableName, { red: R, green: G, blue: B, alpha: A })
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `RGBAの値は0以上1以下でないといけません`
                }
            }
            system.run(() => {
                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i]
                    if (target instanceof Player) {
                        target.spawnParticle(effect, position === undefined ? target.location : position, molang)
                    }
                }
            })
            return {
                status: CustomCommandStatus.Success,
                message: `${display(targets, 10)}にパーティクルを表示させました`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:detect",
        description: "対象の動きを検知します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "xs:detectMotion", type: CustomCommandParamType.Enum }],
        optionalParameters: []
    }, (origin, entities, detect) => {
        const source = origin.sourceEntity
        const include = ["sneak", "swim", "climb", "sprint", "ground", "inwater", "fall", "health", "fly", "glide", "jump", "emote", "valid", "input_jump", "input_sneak", "device", "max_render_distance", "memory_tier", "graphics_mode", "slot", "location", "command_permission_level", "player_permission_level", "dimension", "total_exp", "total_level", "light"]
        if (include.includes(detect)) {
            if (entities.length) {
                system.run(() => {
                    entities.forEach((entity) => {
                        if (entity instanceof Entity) {
                            if (detect === "sneak") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isSneaking) scoreboard.setScore(entity, 1)
                                if (!entity.isSneaking) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "swim") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isSwimming) scoreboard.setScore(entity, 1)
                                if (!entity.isSwimming) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "climb") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isClimbing) scoreboard.setScore(entity, 1)
                                if (!entity.isClimbing) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "sprint") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isSprinting) scoreboard.setScore(entity, 1)
                                if (!entity.isSprinting) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "ground") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isOnGround) scoreboard.setScore(entity, 1)
                                if (!entity.isOnGround) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "inwater") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isInWater) scoreboard.setScore(entity, 1)
                                if (!entity.isInWater) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "fall") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isFalling) scoreboard.setScore(entity, 1)
                                if (!entity.isFalling) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "valid") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isValid) scoreboard.setScore(entity, 1)
                                if (!entity.isValid) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "health") {
                                if (entity.hasComponent("health")) {
                                    if (world.scoreboard.getObjective("detect:health") === undefined) world.scoreboard.addObjective("detect:health", "体力")
                                    const scoreboard = world.scoreboard.getObjective("detect:health")
                                    const Health = entity.getComponent("health").currentValue ?? 0;
                                    scoreboard.setScore(entity, Health)
                                }
                            }
                            else if (detect === "light") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                scoreboard.setScore(entity, entity.dimension.getLightLevel(entity.location))
                            }
                        }
                        if (entity instanceof Player) {
                            if (detect === "fly") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isFlying) scoreboard.setScore(entity, 1)
                                if (!entity.isFlying) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "glide") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isGliding) scoreboard.setScore(entity, 1)
                                if (!entity.isGliding) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "jump") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isJumping) scoreboard.setScore(entity, 1)
                                if (!entity.isJumping) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "emote") {
                                if (world.scoreboard.getObjective(`detect:${detect}`) === undefined) world.scoreboard.addObjective(`detect:${detect}`)
                                const scoreboard = world.scoreboard.getObjective(`detect:${detect}`)
                                if (entity.isEmoting) scoreboard.setScore(entity, 1)
                                if (!entity.isEmoting) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "input_jump") {
                                const st_j = entity.inputInfo.getButtonState(InputButton.Jump)
                                if (world.scoreboard.getObjective("detect:input_jump") === undefined) world.scoreboard.addObjective("detect:input_jump")
                                const scoreboard = world.scoreboard.getObjective("detect:input_jump")
                                if (st_j === ButtonState.Pressed) scoreboard.setScore(entity, 1)
                                if (st_j === ButtonState.Released) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "input_sneak") {
                                const st_s = entity.inputInfo.getButtonState(InputButton.Sneak)
                                if (world.scoreboard.getObjective("detect:input_sneak") === undefined) world.scoreboard.addObjective("detect:input_sneak")
                                const scoreboard = world.scoreboard.getObjective("detect:input_sneak")
                                if (st_s === ButtonState.Pressed) scoreboard.setScore(entity, 1)
                                if (st_s === ButtonState.Released) scoreboard.setScore(entity, 0)
                            }
                            else if (detect === "device") {
                                const device = entity.clientSystemInfo.platformType
                                if (world.scoreboard.getObjective("detect:device_mode") === undefined) world.scoreboard.addObjective("detect:device_mode")

                                const scoreboard = world.scoreboard.getObjective("detect:device_mode")
                                if (device === PlatformType.Desktop) scoreboard.setScore(entity, 0)
                                if (device === PlatformType.Mobile) scoreboard.setScore(entity, 1)
                                if (device === PlatformType.Console) scoreboard.setScore(entity, 2)
                            }
                            else if (detect === "max_render_distance") {
                                const distance = entity.clientSystemInfo.maxRenderDistance
                                if (world.scoreboard.getObjective("detect:max_render_distance") === undefined) world.scoreboard.addObjective("detect:max_render_distance")

                                const scoreboard = world.scoreboard.getObjective("detect:max_render_distance")
                                if (distance > 0) scoreboard.setScore(entity, distance)
                                else scoreboard.setScore(entity, -1)
                            }
                            else if (detect === "memory_tier") {
                                const tier = entity.clientSystemInfo.memoryTier
                                if (world.scoreboard.getObjective("detect:memory_tier") === undefined) world.scoreboard.addObjective("detect:memory_tier")

                                const scoreboard = world.scoreboard.getObjective("detect:memory_tier")
                                scoreboard.setScore(entity, tier)
                            }
                            else if (detect === "graphics_mode") {
                                const graphicsMode = entity.graphicsMode
                                if (world.scoreboard.getObjective("detect:graphics_mode") === undefined) world.scoreboard.addObjective("detect:graphics_mode")

                                const scoreboard = world.scoreboard.getObjective("detect:graphics_mode")
                                if (graphicsMode === GraphicsMode.Simple) scoreboard.setScore(entity, 0)
                                if (graphicsMode === GraphicsMode.Deferred) scoreboard.setScore(entity, 1)
                                if (graphicsMode === GraphicsMode.Fancy) scoreboard.setScore(entity, 2)
                                if (graphicsMode === GraphicsMode.RayTraced) scoreboard.setScore(entity, 3)
                            }
                            else if (detect === "slot") {
                                const slot = entity.selectedSlotIndex
                                if (world.scoreboard.getObjective("detect:selected_slot") === undefined) world.scoreboard.addObjective("detect:selected_slot")

                                const scoreboard = world.scoreboard.getObjective("detect:selected_slot")
                                scoreboard.setScore(entity, slot)
                            }
                            else if (detect === "location") {
                                const x = Math.floor(entity.location.x)
                                const y = Math.floor(entity.location.y)
                                const z = Math.floor(entity.location.z)
                                if (world.scoreboard.getObjective("detect:location_x") === undefined) world.scoreboard.addObjective("detect:location_x")
                                const scoreboardx = world.scoreboard.getObjective("detect:location_x")
                                scoreboardx.setScore(entity, x)
                                if (world.scoreboard.getObjective("detect:location_y") === undefined) world.scoreboard.addObjective("detect:location_y")
                                const scoreboardy = world.scoreboard.getObjective("detect:location_y")
                                scoreboardy.setScore(entity, y)
                                if (world.scoreboard.getObjective("detect:location_z") === undefined) world.scoreboard.addObjective("detect:location_z")
                                const scoreboardz = world.scoreboard.getObjective("detect:location_z")
                                scoreboardz.setScore(entity, z)
                            }
                            else if (detect === "command_permission_level") {
                                const per = entity.commandPermissionLevel
                                if (world.scoreboard.getObjective("detect:command_permission_level") === undefined) world.scoreboard.addObjective("detect:command_permission_level")

                                const scoreboard = world.scoreboard.getObjective("detect:command_permission_level")
                                scoreboard.setScore(entity, per)
                            }
                            else if (detect === "player_permission_level") {
                                const per = entity.playerPermissionLevel
                                if (world.scoreboard.getObjective("detect:player_permission_level") === undefined) world.scoreboard.addObjective("detect:player_permission_level")

                                const scoreboard = world.scoreboard.getObjective("detect:player_permission_level")
                                scoreboard.setScore(entity, per)
                            }
                            else if (detect === "dimension") {
                                const dim = entity.dimension
                                if (world.scoreboard.getObjective("detect:dimension") === undefined) world.scoreboard.addObjective("detect:dimension")

                                const scoreboard = world.scoreboard.getObjective("detect:dimension")
                                if (dim.id === "minecraft:nether") scoreboard.setScore(entity, 0)
                                if (dim.id === "minecraft:overworld") scoreboard.setScore(entity, 1)
                                if (dim.id === "minecraft:the_end") scoreboard.setScore(entity, 2)
                            }
                            else if (detect === "total_exp") {
                                const total = entity.getTotalXp()
                                if (world.scoreboard.getObjective("detect:total_exp") === undefined) world.scoreboard.addObjective("detect:total_exp")

                                const scoreboard = world.scoreboard.getObjective("detect:total_exp")
                                scoreboard.setScore(entity, total)
                            }
                            else if (detect === "total_level") {
                                const total = entity.level
                                if (world.scoreboard.getObjective("detect:total_level") === undefined) world.scoreboard.addObjective("detect:total_level")

                                const scoreboard = world.scoreboard.getObjective("detect:total_level")
                                scoreboard.setScore(entity, total)
                            }
                        }
                    })
                })
                return {
                    status: CustomCommandStatus.Success,
                    message: `${display(entities, 10, "体")}の動作及び情報を検知しました`
                }

            } else return {
                status: CustomCommandStatus.Failure,
                message: `対象のエンティティが存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: "引数が存在しません"
        }
    })

    command.registerCommand({
        name: "xs:health",
        description: "体力を変更します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "xs:healthOption", type: CustomCommandParamType.Enum }],
        optionalParameters: [{ name: "setValue", type: CustomCommandParamType.Integer }]
    }, (origin, targets, param, value) => {
        if (targets.length) {
            if (param === "set" || param === "reset_default" || param === "reset_min" || param === "reset_max") {
                if (param === "set") {
                    if (value !== undefined) {
                        if (value >= 0 && value <= 20) {
                            system.run(() => {
                                for (const entity of targets) {
                                    if (entity instanceof Entity) {
                                        if (entity.hasComponent("health")) {
                                            const Health = entity.getComponent("health")
                                            Health.setCurrentValue(value)
                                        }
                                    }
                                }
                            })
                            return {
                                status: CustomCommandStatus.Success,
                                message: `${display(targets, 10, "体")}の体力を変更しました`
                            }
                        }
                        else return {
                            status: CustomCommandStatus.Failure,
                            message: `値は0以上20以下までの範囲です`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `値が設定されていません`
                    }
                }
                if (param === "reset_default") {
                    system.run(() => {
                        for (const entity of targets) {
                            if (entity instanceof Entity) {
                                if (entity.hasComponent("health")) {
                                    const Health = entity.getComponent("health")
                                    Health.resetToDefaultValue()
                                }
                            }
                        }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の体力をデフォルトにリセットしました`
                    }
                }
                if (param === "reset_min") {
                    system.run(() => {
                        for (const entity of targets) {
                            if (entity instanceof Entity) {
                                if (entity.hasComponent("health")) {
                                    const Health = entity.getComponent("health")
                                    Health.resetToMinValue()
                                }
                            }
                        }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の体力を最小にリセットしました`
                    }
                }
                if (param === "reset_max") {
                    system.run(() => {
                        for (const entity of targets) {
                            if (entity instanceof Entity) {
                                if (entity.hasComponent("health")) {
                                    const Health = entity.getComponent("health")
                                    Health.resetToMaxValue()
                                }
                            }
                        }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の体力を最大にリセットしました`
                    }
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:maxhealth",
        description: "最大体力の値を変更します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "setValue", type: CustomCommandParamType.Float }],
        optionalParameters: []
    }, (origin, targets, value) => {
        if (targets.length) {
            if (value >= 0 && value <= 255) {
                system.run(() => {
                    for (const entity of targets) {
                        if (entity instanceof Entity) {
                            entity.removeEffect("health_boost")
                            if (value > 0) entity.addEffect("health_boost", 20000000, { amplifier: value, showParticles: false })
                            if (value > 0) entity.addEffect("instant_health", 1, { amplifier: 255, showParticles: false })
                        }
                    }
                })
                return {
                    status: CustomCommandStatus.Success,
                    message: `${display(targets, 10, "体")}の最大体力の値を変更しました`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `値は0以上255以下までの範囲です`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:explode",
        description: "爆発を起こします",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "position", type: CustomCommandParamType.Location }, { name: "power", type: CustomCommandParamType.Float }],
        optionalParameters: [{ name: "causesFire", type: CustomCommandParamType.Boolean }, { name: "allowUnderwater", type: CustomCommandParamType.Boolean }]
    }, (origin, pos, power, fire, water) => {
        const source = origin.sourceType
        const typer = origin.sourceBlock ?? origin.sourceEntity
        let dim;
        if (source === CustomCommandSource.Server) {
            dim = world.getDimension("overworld")
        }
        else {
            if (typer !== undefined) {
                dim = typer.dimension
                try {
                    system.run(() => {
                        dim.createExplosion(pos, power, { causesFire: fire === undefined ? false : fire, allowUnderwater: water === undefined ? false : water })
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `爆発を実行しました`
                    }
                } catch (e) {
                    return {
                        status: CustomCommandStatus.Failure,
                        message: `爆発地点の距離が遠すぎます`
                    }
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `実行元が存在しません`
            }
        }
    })

    command.registerCommand({
        name: "xs:lead",
        description: "対象をリードで結びます",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "otherTarget", type: CustomCommandParamType.EntitySelector }],
        optionalParameters: []
    }, (origin, targets, others) => {
        if (targets.length && others.length) {
            system.run(() => {
                for (const target of targets) {
                    if (target instanceof Entity) {
                        if (target.getComponent("leashable")) {
                            const leash = target.getComponent("leashable")
                            const targeter = others.filter(other => other.getComponent("leashable") !== undefined)
                            if (targeter.length) try { leash.leashTo(targeter[floorGetRandom(0, targeter.length - 1)]) } catch { }
                        }
                    }
                }
            })
            return {
                status: CustomCommandStatus.Success,
                message: `対象をリードで結びました`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:weapon",
        description: "防具装着、武器取得を行います",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "xs:weaponSlot", type: CustomCommandParamType.Enum }, { name: "item", type: CustomCommandParamType.ItemType }],
        optionalParameters: [{ name: "amount", type: CustomCommandParamType.Integer }]
    }, (origin, targets, slot, item, amout) => {
        if (targets.length) {
            const weapons = ["mainhand", "offhand", "head", "feet", "chest", "legs", "full_armor"]
            if (weapons.includes(slot)) {
                let amount = 1;
                if (amout !== undefined) amount = amout;
                if (amount >= 1 && amount <= 255) {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof Entity) {
                                    if (target.getComponent("minecraft:equippable")) {
                                        const ec = target.getComponent("minecraft:equippable")
                                        if (slot === "mainhand") ec.setEquipment(EquipmentSlot.Mainhand, new ItemStack(item, amount))
                                        if (slot === "offhand") ec.setEquipment(EquipmentSlot.Offhand, new ItemStack(item, amount))
                                        if (slot === "head") ec.setEquipment(EquipmentSlot.Head, new ItemStack(item, amount))
                                        if (slot === "feet") ec.setEquipment(EquipmentSlot.Chest, new ItemStack(item, amount))
                                        if (slot === "chest") ec.setEquipment(EquipmentSlot.Feet, new ItemStack(item, amount))
                                        if (slot === "legs") ec.setEquipment(EquipmentSlot.Legs, new ItemStack(item, amount))
                                        if (slot === "full_armor") {
                                            ec.setEquipment(EquipmentSlot.Head, new ItemStack(`${item.id.replace("_ingot", "")}_helmet`, amount))
                                            ec.setEquipment(EquipmentSlot.Chest, new ItemStack(`${item.id.replace("_ingot", "")}_chestplate`, amount))
                                            ec.setEquipment(EquipmentSlot.Feet, new ItemStack(`${item.id.replace("_ingot", "")}_boots`, amount))
                                            ec.setEquipment(EquipmentSlot.Legs, new ItemStack(`${item.id.replace("_ingot", "")}_leggings`, amount))
                                        }
                                    }
                                }
                            }
                        } catch (e) {

                        }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `対象の武器、防具を設定しました`
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `アイテムの個数は1から255までの範囲です`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:summonitem",
        description: "アイテムを召喚する",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "itemType", type: CustomCommandParamType.ItemType }],
        optionalParameters: [
            { name: "spawnPos", type: CustomCommandParamType.Location },
            { name: "amount", type: CustomCommandParamType.Integer },
            { name: "nameTag", type: CustomCommandParamType.String },
            { name: "lore", type: CustomCommandParamType.String }]
    }, (origin, itemType, pos, amount, nametag, lore) => {
        const source = origin.sourceType
        const typer = origin.sourceBlock ?? origin.sourceEntity
        if (source !== CustomCommandSource.Server && typer !== undefined) {
            if (amount !== undefined) {
                if (amount >= 1 && amount <= 255) {
                    system.run(() => {
                        const item = new ItemStack(itemType.id, amount === undefined ? 1 : amount);
                        item.nameTag = nametag;
                        item.setLore(lore === undefined ? [] : lore.split(/\\n/g));
                        typer.dimension.spawnItem(item, pos === undefined ? typer.location : pos)
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${itemType.id} を召喚しました`
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `アイテムの個数は1から255までの範囲です`
                }
            }
            else {
                system.run(() => {
                    const item = new ItemStack(itemType.id);
                    item.nameTag = nametag;
                    item.setLore(lore === undefined ? [] : lore.split(/\\n/g));
                    typer.dimension.spawnItem(item, pos === undefined ? typer.location : pos)
                })
                return {
                    status: CustomCommandStatus.Success,
                    message: `${itemType.id} を召喚しました`
                }
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `サーバー側から実行できません`
        }
    })

    command.registerCommand({
        name: "xs:nametag",
        description: "エンティティの名前を変更します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "entity", type: CustomCommandParamType.EntitySelector }, { name: "xs:nameOption", type: CustomCommandParamType.Enum }],
        optionalParameters: [{ name: "nameTag", type: CustomCommandParamType.String }]
    }, (origin, entities, option, nameTag) => {
        const sender = origin.sourceEntity
        if (entities.length) {
            if (option === "set" || option === "reset") {
                if (option === "set") {
                    if (nameTag === undefined) {
                        system.run(() => {
                            entities.forEach((entity) => {
                                if (entity instanceof Player) {
                                    const nick = {
                                        nick: ``,
                                        chat: true,
                                        hide: true
                                    }
                                    entity.setDynamicProperty(`nick`, JSON.stringify(nick))
                                    entity.nameTag = ``
                                }
                                else entity.nameTag = "";
                            })
                        })
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${display(entities, 10, "体")}の名前を隠しました`
                        }
                    }
                    else {
                        system.run(() => {
                            entities.forEach((entity) => {
                                if (entity instanceof Player) {
                                    const nick = {
                                        nick: `${three}`,
                                        chat: true,
                                        hide: false
                                    }
                                    entity.setDynamicProperty(`nick`, JSON.stringify(nick))
                                    entity.nameTag = `${nameTag.replace(/\\n/g, "\n")}`
                                }
                                else entity.nameTag = `${nameTag.replace(/\\n/g, "\n")}`;
                            })
                        })
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${display(entities, 10, "体")}の名前を ${nameTag} にしました`
                        }
                    }
                }
                else if (option === "reset") {
                    system.run(() => {
                        entities.forEach((entity) => {
                            if (entity instanceof Player) {
                                if (entity.getDynamicProperty("nick") !== undefined) {
                                    entity.setDynamicProperty("nick")
                                    entity.nameTag = entity.name
                                }
                            }
                            else entity.nameTag = "";
                        })
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(entities, 10, "体")}の名前を元に戻しました`
                    }
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `その引数は存在しません`
            }
        } else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:heal",
        description: "体力を回復します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [],
        optionalParameters: []
    }, (origin) => {
        const sender = origin.sourceEntity
        if (sender instanceof Entity) {
            system.run(() => {
                sender.addEffect("instant_health", 1, { showParticles: false, amplifier: 255 })
            })
        }
        return {
            status: CustomCommandStatus.Success,
            message: `体力を回復しました`
        }
    })

    command.registerCommand({
        name: "xs:feed",
        description: "満腹度を回復します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [],
        optionalParameters: []
    }, (origin) => {
        const sender = origin.sourceEntity
        if (sender instanceof Entity) {
            system.run(() => {
                sender.addEffect("saturation", 30, { showParticles: false, amplifier: 255 })
            })
        }
        return {
            status: CustomCommandStatus.Success,
            message: `満腹度を回復しました`
        }
    })

    command.registerCommand({
        name: "xs:interact",
        description: "インタラクト操作を制御します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "xs:interactType", type: CustomCommandParamType.Enum }, { name: "enable", type: CustomCommandParamType.Boolean }],
        optionalParameters: []
    }, (origin, targets, type, isEnable) => {
        const entity = origin.sourceEntity
        if (targets.length) {
            if (type === "minecraft:place" || type === "minecraft:break" || type === "minecraft:interact_block" || type === "minecraft:interact_entity" || type === "minecraft:attack_entity" || type === "minecraft:pickup" || type === "minecraft:item_use" || type === "minecraft:item_drop" || type === "minecraft:chest_use") {
                for (const target of targets) {
                    if (target instanceof Entity) {
                        target.setDynamicProperty(type, isEnable)
                    }
                }
                return {
                    status: CustomCommandStatus.Success,
                    message: `${display(targets, 10, "体")}のインタラクト操作に変更を加えました`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: "引数が存在しません"
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:lookat",
        description: "エンティティの視点方向を指定します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.EntitySelector }, { name: "location", type: CustomCommandParamType.Location }],
        optionalParameters: []
    }, (origin, targets, location) => {
        const entity = origin.sourceEntity
        if (targets.length) {
            system.run(() => {
                try {
                    for (const target of targets) {
                        if (target instanceof Entity) {
                            if (target.typeId !== "minecraft:player") target.lookAt(location)
                        }
                    }
                } catch (e) { }
            })
            return {
                status: CustomCommandStatus.Success,
                message: `${display(targets, 10, "体")}の視点方向を (${location.x} ${location.y} ${location.z}) にしました`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:bot",
        description: "botを呼び出します。",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "spawnLocation", type: CustomCommandParamType.Location }],
        optionalParameters: [{ name: "botName", type: CustomCommandParamType.String }, { name: "xs:gamemode", type: CustomCommandParamType.Enum }, { name: "xs:canRespawn", type: CustomCommandParamType.Boolean }]
    }, (origin, location, name, gamemode, respawn) => {
        const entity = origin.sourceEntity ?? origin.sourceBlock ?? origin.initiator
        const gamemodes = ["survival", "adventure", "creative", "spectator"]
        if (entity !== undefined) {
            if (gamemodes.includes(gamemode) || gamemode === undefined) {
                let gamemoder = "Survival"
                if (gamemode === "adventure") gamemoder = "Adventure"
                if (gamemode === "spectator") gamemoder = "Spectator"
                if (gamemode === "creative") gamemoder = "Creative"
                system.run(() => {
                    const bot = spawnSimulatedPlayer({ dimension: entity.dimension, ...location }, name ?? "bot", gamemoder)
                    if (bot instanceof SimulatedPlayer) {
                        bot.setDynamicProperty("bot", true)
                        bot.addTag("ex:bot")
                        let s = system.runInterval(() => {
                            try {
                                const health = bot.getComponent("health").currentValue
                                if (health === 0) {
                                    if (!respawn && respawn !== undefined) {
                                        bot.disconnect()
                                        system.clearRun(s)
                                    }
                                    else {
                                        bot.respawn()
                                    }
                                }
                            } catch (e) {
                                system.clearRun(s)
                            }
                        })
                    }
                })
                return {
                    status: CustomCommandStatus.Success,
                    message: `botを召喚しました`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `呼び出しに失敗しました`
        }
    })

    command.registerCommand({
        name: "xs:bot-move",
        description: "botを動かします。",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }, { name: "xs:moveOption", type: CustomCommandParamType.Enum }, { name: "x", type: CustomCommandParamType.Float }, { name: "z", type: CustomCommandParamType.Float }],
        optionalParameters: []
    }, (origin, targets, option, x, z) => {
        if (targets.length) {
            const gamemodes = ["move", "move_relative"]
            if (gamemodes.includes(option)) {
                system.run(() => {
                    if (option === "move") {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.move(x, z)
                                    }
                                }
                            }
                        } catch (e) { }
                    }
                    if (option === "move_relative") {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.moveRelative(x, z)
                                    }
                                }
                            }
                        } catch (e) { }
                    }
                })
                return {
                    status: CustomCommandStatus.Success,
                    message: `${display(targets, 10, "体")}を移動させました`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:bot-location",
        description: "指定位置を基にbotを操作します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }, { name: "xs:moveToLocationOption", type: CustomCommandParamType.Enum }, { name: "location", type: CustomCommandParamType.Location }],
        optionalParameters: [{ name: "location2", type: CustomCommandParamType.Location }, { name: "location3", type: CustomCommandParamType.Location }, { name: "location4", type: CustomCommandParamType.Location }, { name: "location5", type: CustomCommandParamType.Location }]
    }, (origin, targets, option, location, loc2, loc3, loc4, loc5) => {
        if (targets.length) {
            const gamemodes = ["move_to_block", "move_to_location", "navigate_to_block", "navigate_to_location", "navigate_to_locations", "lookat_block", "interact_block", "break_block"]
            if (gamemodes.includes(option)) {
                if (option === "move_to_block") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.moveToBlock(location)
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}を移動させました`
                    }
                }
                if (option === "move_to_location") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.moveToLocation(location)
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}を移動させました`
                    }
                }
                if (option === "navigate_to_block") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.navigateToBlock(location)
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}を移動させました`
                    }
                }
                if (option === "navigate_to_location") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.navigateToLocation(location)
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}を移動させました`
                    }
                }
                if (option === "interact_block") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.interactWithBlock(location)
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}をインタラクトさせました`
                    }
                }
                if (option === "break_block") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.breakBlock(location)
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}をインタラクトさせました`
                    }
                }
                if (option === "lookat_block") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.lookAtBlock(location)
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の視点方向を変えました`
                    }
                }
                if (option === "navigate_to_locations") {
                    let locations = [location]
                    if (loc2 !== undefined) locations.push(loc2)
                    if (loc3 !== undefined) locations.push(loc3)
                    if (loc4 !== undefined) locations.push(loc4)
                    if (loc5 !== undefined) locations.push(loc5)
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.navigateToLocations(locations)
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}を複数地点に移動させました`
                    }
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:bot-target",
        description: "対象のエンティティを基にbotを操作します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }, { name: "xs:entityOption", type: CustomCommandParamType.Enum }, { name: "targetEntity", type: CustomCommandParamType.EntitySelector }],
        optionalParameters: []
    }, (origin, targets, option, entities) => {
        if (targets.length && entities.length) {
            const gamemodes = ["navigate_to_entity", "attack_entity", "interact_entity", "lookat_entity"]
            if (gamemodes.includes(option)) {
                if (entities.length === 1) {
                    if (option === "navigate_to_entity") {
                        system.run(() => {
                            try {
                                for (const target of targets) {
                                    if (target instanceof SimulatedPlayer) {
                                        if (target.getDynamicProperty("bot")) {
                                            target.navigateToEntity(entities[0])
                                        }
                                    }
                                }
                            } catch (e) { }
                        })
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${display(targets, 10, "体")}を対象のエンティティの位置まで移動させました`
                        }
                    }
                    if (option === "attack_entity") {
                        system.run(() => {
                            try {
                                for (const target of targets) {
                                    if (target instanceof SimulatedPlayer) {
                                        if (target.getDynamicProperty("bot")) {
                                            target.attackEntity(entities[0])
                                        }
                                    }
                                }
                            } catch (e) { }
                            return {
                                status: CustomCommandStatus.Success,
                                message: `${display(targets, 10, "体")}に対象のエンティティを攻撃させました`
                            }
                        })
                    }
                    if (option === "interact_entity") {
                        system.run(() => {
                            try {
                                for (const target of targets) {
                                    if (target instanceof SimulatedPlayer) {
                                        if (target.getDynamicProperty("bot")) {
                                            target.interactWithEntity(entities[0])
                                        }
                                    }
                                }
                            } catch (e) { }
                        })
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${display(targets, 10, "体")}に対象のエンティティをインタラクト操作させました`
                        }
                    }
                    if (option === "lookat_entity") {
                        system.run(() => {
                            try {
                                for (const target of targets) {
                                    if (target instanceof SimulatedPlayer) {
                                        if (target.getDynamicProperty("bot")) {
                                            target.lookAtEntity(entities[0])
                                        }
                                    }
                                }
                            } catch (e) { }
                        })
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${display(targets, 10, "体")}の視点方向を変えました`
                        }
                    }
                }
                else return {
                    status: CustomCommandStatus.Failure,
                    message: `対象が多すぎます`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:bot-stop",
        description: "botの操作をstopします",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }, { name: "xs:stopOption", type: CustomCommandParamType.Enum }],
        optionalParameters: []
    }, (origin, targets, option) => {
        if (targets.length) {
            const gamemodes = ["breaking_block", "build", "interacting", "flying", "gliding", "moving", "swimming", "using_item", "sneaking"]
            if (gamemodes.includes(option)) {
                if (option === "breaking_block") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.stopBreakingBlock()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}のブロック破壊を止めました`
                    }
                }
                if (option === "build") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.stopBuild()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の建築を止めました`
                    }
                }
                if (option === "interacting") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.stopInteracting()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}のインタラクト操作を止めました`
                    }
                }
                if (option === "flying") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.stopFlying()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の飛行を止めました`
                    }
                }
                if (option === "gliding") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.stopGliding()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の滑空を止めました`
                    }
                }
                if (option === "sneaking") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.isSneaking = false;
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}のスニークを止めました`
                    }
                }
                if (option === "moving") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.stopMoving()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の移動を止めました`
                    }
                }
                if (option === "swimming") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.stopSwimming()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の泳ぎを止めました`
                    }
                }
                if (option === "using_item") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.stopUsingItem()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}のアイテム使用を止めました`
                    }
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:bot-give",
        description: "botにアイテムを渡します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }, { name: "slot", type: CustomCommandParamType.Integer }, { name: "item", type: CustomCommandParamType.ItemType }],
        optionalParameters: [{ name: "amount", type: CustomCommandParamType.Integer }]
    }, (origin, targets, slot, item, amout) => {
        if (targets.length) {
            let amount = 1;
            if (amout !== undefined) amount = amout;
            if (amount >= 1 && amount <= 255) {
                system.run(() => {
                    try {
                        for (const target of targets) {
                            if (target instanceof SimulatedPlayer) {
                                if (target.getDynamicProperty("bot")) {
                                    target.setItem(new ItemStack(item, amount), slot)
                                }
                            }
                        }
                    } catch (e) { }
                })
                return {
                    status: CustomCommandStatus.Success,
                    message: `${display(targets, 10, "体")}に ${item.id} を ${amount} 個与えました`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `アイテムの個数は1から255までの範囲です`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:bot-chat",
        description: "botに発言させます",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }, { name: "text", type: CustomCommandParamType.String }],
        optionalParameters: []
    }, (origin, targets, text) => {
        if (targets.length) {
            system.run(() => {
                try {
                    for (const target of targets) {
                        if (target instanceof SimulatedPlayer) {
                            if (target.getDynamicProperty("bot")) {
                                target.chat(text)
                            }
                        }
                    }
                } catch (e) { }
            })
            return {
                status: CustomCommandStatus.Success,
                message: `${display(targets, 10, "体")}に発言させました`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:bot-skin",
        description: "botのskinを変更します",
        permissionLevel: CommandPermissionLevel.Host,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }, { name: "targetPlayerSkin", type: CustomCommandParamType.PlayerSelector }],
        optionalParameters: []
    }, (origin, targets, players) => {
        if (targets.length && players.length) {
            if (players.length === 1) {
                system.run(() => {
                    // try {
                    for (const target of targets) {
                        if (target instanceof SimulatedPlayer) {
                            // if (target.getDynamicProperty("bot")) {
                            target.setSkin(getPlayerSkin(players[0]))
                            // }
                        }
                    }
                    // } catch (e) { }
                })
                return {
                    status: CustomCommandStatus.Success,
                    message: `${display(targets, 10, "体")}のskinを変更しました`
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `対象が多すぎます`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:bot-start",
        description: "botのその他操作を開始します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }, { name: "xs:startOption", type: CustomCommandParamType.Enum }],
        optionalParameters: [{ name: "slot", type: CustomCommandParamType.Integer }, { name: "location", type: CustomCommandParamType.Location }]
    }, (origin, targets, option, slot, location) => {
        if (targets.length) {
            const gamemodes = ["build", "sneak", "interact", "jump", "fly", "glide", "swim", "use_item_in_slot", "use_item_in_slot_on_block", "respawn"]
            if (gamemodes.includes(option)) {
                if (option === "build") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.startBuild(slot)
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の建築を開始しました`
                    }
                }
                if (option === "interact") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.interact()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}のインタラクト操作を開始しました`
                    }
                }
                if (option === "jump") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.jump()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}をジャンプさせました`
                    }
                }
                if (option === "sneak") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.isSneaking = true;
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}をスニークさせました`
                    }
                }
                if (option === "respawn") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.respawn()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}をリスポーンさせました`
                    }
                }
                if (option === "fly") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.fly()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の飛行を開始しました`
                    }
                }
                if (option === "glide") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.glide()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の滑空を開始しました`
                    }
                }
                if (option === "swim") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.swim()
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}の泳ぎを開始しました`
                    }
                }
                if (option === "use_item_in_slot") {
                    system.run(() => {
                        try {
                            for (const target of targets) {
                                if (target instanceof SimulatedPlayer) {
                                    if (target.getDynamicProperty("bot")) {
                                        target.useItemInSlot(slot ?? 0)
                                    }
                                }
                            }
                        } catch (e) { }
                    })
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${display(targets, 10, "体")}のアイテム使用を開始しました`
                    }
                }
                if (option === "use_item_in_slot_on_block") {
                    if (location !== undefined) {
                        system.run(() => {
                            try {
                                for (const target of targets) {
                                    if (target instanceof SimulatedPlayer) {
                                        if (target.getDynamicProperty("bot")) {
                                            target.useItemInSlotOnBlock(slot ?? 0, location)
                                        }
                                    }
                                }
                            } catch (e) { }
                        })
                        return {
                            status: CustomCommandStatus.Success,
                            message: `${display(targets, 10, "体")}のブロックに対してのアイテム使用を開始しました`
                        }
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: `座標が指定されていません`
                    }
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: `引数が存在しません`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:disconnect",
        description: "接続を切断します",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }],
        optionalParameters: []
    }, (origin, targets) => {
        if (targets.length) {
            system.run(() => {
                try {
                    for (const target of targets) {
                        if (target instanceof SimulatedPlayer) {
                            if (target.getDynamicProperty("bot")) {
                                target.disconnect()
                            }
                        }
                    }
                } catch (e) { }
            })
            return {
                status: CustomCommandStatus.Success,
                message: `${display(targets, 10, "体")}の接続を切断しました`
            }
        }
        else return {
            status: CustomCommandStatus.Failure,
            message: `対象のエンティティが存在しません`
        }
    })

    command.registerCommand({
        name: "xs:js",
        description: "javascriptの実行",
        permissionLevel: CommandPermissionLevel.Host,
        mandatoryParameters: [{ name: "code", type: CustomCommandParamType.String }],
        optionalParameters: []
    }, (origin, code) => {
        if (origin.sourceType === CustomCommandSource.Entity) {
            const init = origin.sourceEntity
            if (world.getAllPlayers().find(p => p.id === init.id)) {
                if (init instanceof Player) {
                    if (allowList.includes(init.name) && init.hasTag("server:debug")) {
                        // system.run(() => {
                        try {
                            const sender = origin.sourceEntity
                            eval(code)
                            return {
                                status: CustomCommandStatus.Success,
                                message: "処理が正常に行われました"
                            }
                        } catch (e) {
                            return {
                                status: CustomCommandStatus.Failure,
                                message: `${e}`
                            }
                        }
                        // })
                    }
                    else return {
                        status: CustomCommandStatus.Failure,
                        message: "実行許可リスト外です"
                    }
                }
            }
            else return {
                status: CustomCommandStatus.Failure,
                message: "プレイヤー以外からの実行はできません"
            }
        }
        else {
            return {
                status: CustomCommandStatus.Failure,
                message: "プレイヤー以外からの実行はできません"
            }
        }
    })
})

function display(targets, length = 10, type = "人", duplicate = 0) {
    const localizationKeys = targets.map((s) => s.name === undefined ? s.nameTag === "" ? localizationKeyToEntityName(s.localizationKey) : s.nameTag : s.name)
    if (localizationKeys.length >= length) {
        return `${localizationKeys.length - duplicate}${type} `
    }
    else return `${localizationKeys.join(", ")} `
}

function localizationKeyToEntityName(localizationKey) {
    let result = localizationKey
    for (const key in LocalKeys) {
        if (key === localizationKey) {
            result = LocalKeys[key]
        }
    }
    return result;
}
