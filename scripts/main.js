import { beforeEvents } from "@minecraft/server-admin"
import "./API/slashCommands"
import { ButtonState, InputButton, InputMode, system, world } from "@minecraft/server"
import { globalIds } from "./API/lib/karageAPI"
import playerDropBeforeEvent from "./API/lib/events/playerDropBeforeEvent"
import playerUseChestBeforeEvent from "./API/lib/events/playerUseChestBeforeEvent"
import playerMoveAfterEvent, { PlayerInputKey } from "./API/lib/events/playerMoveAfterEvent"

system.run(() => {
    const result = beforeEvents.asyncPlayerJoin.subscribe((data) => {
        if (data.isValid()) {
            const id = data.persistentId
            const name = data.name
            globalIds.create("nbanId")
            globalIds.create("playerData")
            const gid = new globalIds("globalId", { name: name, id: id })
            const did = new globalIds("banId", { name: name, id: id })
            const playerId = globalIds.getId(name, "playerData")
            if (playerId !== undefined) {
                const bid = new globalIds("nbanId", { name: name, id: playerId })
                if (!bid.isValid()) bid.create()
                if (bid.DoesExistId()) {
                    if (bid.name !== name) {
                        bid.rename(name)
                    }
                    data.disallowJoin(`§eban >> §c貴方はこのサーバーからBANされています。`)
                    console.log(`banned user: ${name} (id: ${playerId})`)
                }
            }
            if (!gid.isValid()) gid.create().add()
            if (!did.isValid()) did.create()
            if (name === "Steve" || name.startsWith("discord.gg/")) {
                data.disallowJoin(`lumine proxyの使用を検知したため、切断されました。`)
            }
            else {
                if (!gid.DoesExistId()) {
                    gid.add()
                }
                else {
                    const data = gid.getData()
                    if (data.name !== name) {
                        gid.rename(name)
                    }
                }
                if (did.DoesExistId()) {
                    if (did.name !== name) {
                        did.rename(name)
                    }
                    data.disallowJoin(`§qaccount ban >> §c貴方はこのサーバーからBANされています。\n処理アカウントID: ${id}`)
                    console.log(`banned user: ${name} (pfid: ${id})`)
                    world.sendMessage(`§s[ac-ban] §c${name} (pfid: §a${id}§c) のログインを検知したため、切断を実行しました。`)
                }
                else {
                    console.log(`player joined: ${name} - ${playerId} (pfid:${id})`)
                    return Promise.resolve()
                }
            }
        }
    })
})

world.afterEvents.playerSpawn.subscribe((data) => {
    const sender = data.player
    if (data.initialSpawn) {
        const data = new globalIds("playerData", { name: sender.name, id: sender.id })
        if (!data.isValid()) data.create().add()
        if (!data.DoesExistId()) {
            data.add()
        }
        else {
            const dat = data.getData()
            if (dat.name !== sender.name) {
                dat.rename(sender.name)
            }
        }
        if (sender.getDynamicProperty("nick") !== undefined) {
            const nick = JSON.parse(sender.getDynamicProperty("nick"))
            if (nick.hide === true) {
                sender.nameTag = ""
            }
            else {
                sender.nameTag = nick.nick.replace(/\\n/g, "\n").replace(/#n/g, " ")
            }
        }
        if (world.scoreboard.getObjective("detect:login")) {
            const scoreboard = world.scoreboard.getObjective("detect:login")
            scoreboard.setScore(sender, 1)
            system.run(() => {
                scoreboard.setScore(sender, 0)
            })
        }
    }
    else {
        if (world.scoreboard.getObjective("detect:spawn")) {
            const scoreboard = world.scoreboard.getObjective("detect:spawn")
            scoreboard.setScore(sender, 1)
            system.run(() => {
                scoreboard.setScore(sender, 0)
            })
        }
    }
})

world.beforeEvents.chatSend.subscribe((data) => {
    const sender = data.sender
    if (sender.getDynamicProperty("nick") !== undefined) {
        const nick = JSON.parse(sender.getDynamicProperty("nick"))
        const Nickname = nick.nick.replace(/\\n/g, "\n").replace(/#n/g, " ").split("\n")[0]
        if (nick.chat === true) {
            data.cancel = true;
            if (nick.hide === true) {
                world.sendMessage(`<???>§r ${message}`)
            }
            else {
                world.sendMessage(`<${Nickname}§r> ${message}`)
            }
        }
    }
    if (world.scoreboard.getObjective("detect:chat")) {
        const scoreboard = world.scoreboard.getObjective("detect:chat")
        system.run(() => {
            scoreboard.setScore(sender, 1)
            system.run(() => {
                scoreboard.setScore(sender, 0)
            })
        })
    }
})

/*

この下イベント検知・キャンセル

*/

playerMoveAfterEvent.subscribe((data) => {
    const sender = data.player
    const keys = data.keys
    const first = data.firstKeys
    if (world.scoreboard.getObjective("detect:keys")) {
        let w = 0;
        let a = 0;
        let s = 0;
        let d = 0;
        let sh = 0;
        let sp = 0;
        const scoreboard = world.scoreboard.getObjective("detect:keys")
        if (keys.includes(PlayerInputKey.W)) w = 1;
        if (keys.includes(PlayerInputKey.A)) a = 1;
        if (keys.includes(PlayerInputKey.S)) s = 1;
        if (keys.includes(PlayerInputKey.D)) d = 1;
        if (keys.includes(PlayerInputKey.SHIFT)) sh = 1;
        if (keys.includes(PlayerInputKey.SPACE)) sp = 1;
        let sum = Number(`2` + `${w}` + `${a}` + `${s}` + `${d}` + `${sh}` + `${sp}`)
        scoreboard.setScore(sender, sum)
    }
})

world.afterEvents.playerSwingStart.subscribe((data) => {
    const sender = data.player
    if (world.scoreboard.getObjective("detect:swing") !== undefined) {
        world.scoreboard.getObjective("detect:swing").setScore(sender, 1)
        system.run(() => {
            world.scoreboard.getObjective("detect:swing").setScore(sender, 0)
        })
    }
})

playerDropBeforeEvent.subscribe((data) => {
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:item_drop") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:item_drop")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (world.scoreboard.getObjective("detect:item_drop") !== undefined) {
        system.run(() => {
            world.scoreboard.getObjective("detect:item_drop").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:item_drop").setScore(sender, 0)
            })
        })
    }
})

playerUseChestBeforeEvent.subscribe((data) => {
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:chest_use") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:chest_use")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (world.scoreboard.getObjective("detect:chest_use") !== undefined) {
        system.run(() => {
            world.scoreboard.getObjective("detect:chest_use").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:chest_use").setScore(sender, 0)
            })
        })
    }
})

world.beforeEvents.entityItemPickup.subscribe((data) => {
    const sender = data.entity
    if (sender.getDynamicProperty("minecraft:pickup") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:pickup")
        if (!enable) {
            data.cancel = true;
        }
        else {
            if (world.scoreboard.getObjective("detect:pickup") !== undefined) {
                system.run(() => {
                    world.scoreboard.getObjective("detect:pickup").setScore(sender, 1)
                    system.run(() => {
                        world.scoreboard.getObjective("detect:pickup").setScore(sender, 0)
                    })
                })
            }
        }
    }
    else {
        if (world.scoreboard.getObjective("detect:pickup") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:pickup").setScore(sender, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:pickup").setScore(sender, 0)
                })
            })
        }
    }
})

world.beforeEvents.itemUse.subscribe((data) => {
    const sender = data.source
    if (sender.getDynamicProperty("minecraft:item_use") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:item_use")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (world.scoreboard.getObjective("detect:item_use") !== undefined) {
        system.run(() => {
            world.scoreboard.getObjective("detect:item_use").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:item_use").setScore(sender, 0)
            })
        })
    }
})

world.beforeEvents.entityHurt.subscribe((data) => {
    const sender = data.damageSource.damagingEntity ?? data.damageSource.damagingProjectile
    if (sender !== undefined) {
        if (sender.getDynamicProperty("minecraft:attack_entity") !== undefined) {
            const enable = sender.getDynamicProperty("minecraft:attack_entity")
            if (!enable) {
                data.cancel = true;
            }
        }
        if (world.scoreboard.getObjective("detect:attack_entity") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:attack_entity").setScore(sender, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:attack_entity").setScore(sender, 0)
                })
            })
        }
    }
})

world.beforeEvents.playerBreakBlock.subscribe((data) => {
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:break") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:break")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (world.scoreboard.getObjective("detect:break") !== undefined) {
        system.run(() => {
            world.scoreboard.getObjective("detect:break").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:break").setScore(sender, 0)
            })
        })
    }
})

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:place") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:place")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (world.scoreboard.getObjective("detect:place") !== undefined) {
        system.run(() => {
            world.scoreboard.getObjective("detect:place").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:place").setScore(sender, 0)
            })
        })
    }
})

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:interact_block") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:interact_block")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (world.scoreboard.getObjective("detect:interact_block") !== undefined) {
        system.run(() => {
            world.scoreboard.getObjective("detect:interact_block").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:interact_block").setScore(sender, 0)
            })
        })
    }
})

world.beforeEvents.playerInteractWithEntity.subscribe((data) => {
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:interact_entiy") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:interact_entiy")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (world.scoreboard.getObjective("detect:interact_entiy") !== undefined) {
        system.run(() => {
            world.scoreboard.getObjective("detect:interact_entiy").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:interact_entiy").setScore(sender, 0)
            })
        })
    }
})

world.afterEvents.entityDie.subscribe((data) => {
    const sender = data.deadEntity
    const killer = data.damageSource.damagingEntity
    if (sender.typeId === "minecraft:player") {
        if (world.scoreboard.getObjective("detect:dead")) {
            const scoreboard = world.scoreboard.getObjective("detect:dead")
            scoreboard.setScore(sender, 1)
            system.run(() => {
                scoreboard.setScore(sender, 0)
            })
        }
        if (killer !== undefined) {
            if (world.scoreboard.getObjective("detect:kill")) {
                const scoreboard = world.scoreboard.getObjective("detect:kill")
                scoreboard.setScore(sender, 1)
                system.run(() => {
                    scoreboard.setScore(sender, 0)
                })
            }
        }
    }
    else {
        if (killer !== undefined) {
            if (world.scoreboard.getObjective("detect:entity_kill")) {
                try {
                    const scoreboard = world.scoreboard.getObjective("detect:entity_kill")
                    scoreboard.setScore(sender, 1)
                    system.run(() => {
                        scoreboard.setScore(sender, 0)
                    })
                } catch (e) {

                }
            }
        }
    }
})

world.afterEvents.weatherChange.subscribe((data) => {
    const previous = data.previousWeather
    const news = data.newWeather
    if (world.scoreboard.getObjective("detect:weather")) {
        const scoreboard = world.scoreboard.getObjective("detect:weather")
        if (previous === "Clear") {
            scoreboard.setScore("previous", 0)
        }
        else if (previous === "Rain") {
            scoreboard.setScore("previous", 1)
        }
        else {
            scoreboard.setScore("previous", 2)
        }
        if (news === "Clear") {
            scoreboard.setScore("new", 0)
        }
        else if (news === "Rain") {
            scoreboard.setScore("new", 1)
        }
        else {
            scoreboard.setScore("new", 2)
        }
    }
})

world.afterEvents.playerButtonInput.subscribe((data) => {
    const sender = data.player
    const button = data.button
    const newbutton = data.newButtonState
    if (button === InputButton.Jump && newbutton === ButtonState.Pressed) {
        if (world.scoreboard.getObjective("detect:input_jump_pressed") !== undefined) {
            world.scoreboard.getObjective("detect:input_jump_pressed").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:input_jump_pressed").setScore(sender, 0)
            })
        }
    }
    if (button === InputButton.Jump && newbutton === ButtonState.Released) {
        if (world.scoreboard.getObjective("detect:input_jump_released") !== undefined) {
            world.scoreboard.getObjective("detect:input_jump_released").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:input_jump_released").setScore(sender, 0)
            })
        }
    }
    if (button === InputButton.Sneak && newbutton === ButtonState.Pressed) {
        if (world.scoreboard.getObjective("detect:input_sneak_pressed") !== undefined) {
            world.scoreboard.getObjective("detect:input_sneak_pressed").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:input_sneak_pressed").setScore(sender, 0)
            })
        }
    }
    if (button === InputButton.Sneak && newbutton === ButtonState.Pressed) {
        if (world.scoreboard.getObjective("detect:input_sneak_released") !== undefined) {
            world.scoreboard.getObjective("detect:input_sneak_released").setScore(sender, 1)
            system.run(() => {
                world.scoreboard.getObjective("detect:input_sneak_released").setScore(sender, 0)
            })
        }
    }
})
