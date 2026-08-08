import { beforeEvents } from "@minecraft/server-admin"
import "./API/slashCommands"
import { ButtonState, InputButton, InputMode, system, world } from "@minecraft/server"
import { globalIds, playersList, queue } from "./API/lib/karageAPI"
import playerDropBeforeEvent from "./API/lib/events/playerDropBeforeEvent"
import playerUseChestBeforeEvent from "./API/lib/events/playerUseChestBeforeEvent"
import playerMoveAfterEvent, { PlayerInputKey } from "./API/lib/events/playerMoveAfterEvent"
import playerFishingAfterEvent from "./API/lib/events/playerFishingAfterEvent"
import playerXpChangeAfterEvent from "./API/lib/events/playerXpChangeAfterEvent"
import playerRideAfterEvent from "./API/lib/events/playerRideAfterEvent"
import playerGetOffAfterEvent from "./API/lib/events/playerGetOffAfterEvent"
import { BAN_QUEUE, JSON_BAN_DATA, JSON_PLAYERS_DATA } from "./import_data"
system.run(() => {
    const result = beforeEvents.asyncPlayerJoin.subscribe((data) => {
        if (data.isValid()) {
            const id = data.persistentId
            const name = data.name
            const q = queue.create("ban")
            if (playersList.isValid()) {
                if (!playersList.DoesExistPlayer(id)) playersList.addPlayer(name, id)
                if (q.has(name)) {
                    const p = playersList.getPlayer(id)
                    p.ban()
                    data.disconnect(`このサーバーへのアクセスが禁止されています`)
                    console.info(`${name} (${id}) - successfully pushed banlist`)
                    q.remove(name)
                }
                else {
                    if (world.getPlayers().length > 0) {
                        const p = playersList.getPlayer(id)
                        if (p.getName() !== name) p.rename(name)
                        if (p.hasBanned()) {
                            data.disconnect(`このサーバーへのアクセスが禁止されています`)
                            console.info(`${name} (${id}) - successfully disconnected`)
                        }
                        else return Promise.resolve()
                    }
                    else return Promise.resolve()
                }
            } else return Promise.resolve()
        }
    })
})

world.afterEvents.playerSpawn.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.player
    if (data.initialSpawn) {
        if (!playersList.isValid()) playersList.initialize()
        if (!playersList.DoesExistPlayer(sender.persistentId)) playersList.addPlayer(sender.name, sender.persistentId)
        if (sender.getDynamicProperty("nick") !== undefined) {
            const nick = JSON.parse(sender.getDynamicProperty("nick"))
            if (nick.hide === true) {
                sender.nameTag = ""
            }
            else {
                sender.nameTag = nick.nick.replace(/\\n/g, "\n").replace(/#n/g, " ")
            }
        }
        if (pack["command:detect_scoreboard"] === true) {
            if (world.scoreboard.getObjective("detect:login")) {
                const scoreboard = world.scoreboard.getObjective("detect:login")
                scoreboard.setScore(sender, 1)
                system.run(() => {
                    scoreboard.setScore(sender, 0)
                })
            }
        }
    }
    else {
        if (pack["command:detect_scoreboard"] === true) {
            if (world.scoreboard.getObjective("detect:spawn")) {
                const scoreboard = world.scoreboard.getObjective("detect:spawn")
                scoreboard.setScore(sender, 1)
                system.run(() => {
                    scoreboard.setScore(sender, 0)
                })
            }
        }
    }
})

world.beforeEvents.chatSend.subscribe((data) => {
    const pack = world.getPackSettings()
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
    if (pack["command:detect_scoreboard"] === true) {
        if (world.scoreboard.getObjective("detect:chat")) {
            const scoreboard = world.scoreboard.getObjective("detect:chat")
            system.run(() => {
                scoreboard.setScore(sender, 1)
                system.run(() => {
                    scoreboard.setScore(sender, 0)
                })
            })
        }
    }
    if (sender.getDynamicProperty("minecraft:chat") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:chat")
        if (!enable) {
            data.cancel = true;
        }
    }
})

/*

この下イベント検知・キャンセル

*/

system.beforeEvents.startup.subscribe((data) => {
    data.dimensionRegistry.registerCustomDimension("custom:dim_1")
    data.dimensionRegistry.registerCustomDimension("custom:dim_2")
    data.dimensionRegistry.registerCustomDimension("custom:dim_3")
})

world.afterEvents.worldLoad.subscribe((data) => {
    if (!playersList.isValid()) playersList.initialize()
})

world.afterEvents.worldLoad.subscribe((data) => {
    const pack = world.getPackSettings()
    if (pack["command:detect_scoreboard"] === true) {
        playerFishingAfterEvent.subscribe((data) => {
            const sender = data.player
            const entity = data.itemEntity
            if (world.scoreboard.getObjective("detect:fishing") !== undefined) {
                world.scoreboard.getObjective("detect:fishing").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:fishing").setScore(sender, 0)
                }, 1)
            }
            if (world.scoreboard.getObjective("detect:fishing_result") !== undefined) {
                if (data.result) world.scoreboard.getObjective("detect:fishing_result").setScore(sender, 1)
                else world.scoreboard.getObjective("detect:fishing_result").setScore(sender, 0)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:fishing_result").setScore(sender, -1)
                }, 1)
            }
            if (entity !== undefined) {
                if (world.scoreboard.getObjective("detect:fishing_item") !== undefined) {
                    world.scoreboard.getObjective("detect:fishing_item").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:fishing_item").setScore(sender, 0)
                    }, 1)
                }
            }
        })
        playerXpChangeAfterEvent.subscribe((data) => {
            const sender = data.player
            const xp = data.xp
            if (world.scoreboard.getObjective("detect:xp_change") !== undefined) {
                world.scoreboard.getObjective("detect:xp_change").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:xp_change").setScore(sender, 0)
                }, 1)
            }
            if (world.scoreboard.getObjective("detect:xp_change_num") !== undefined) {
                world.scoreboard.getObjective("detect:xp_change_num").setScore(sender, xp)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:xp_change_num").setScore(sender, 0)
                }, 1)
            }
        })
        playerRideAfterEvent.subscribe((data) => {
            const sender = data.player
            const entity = data.entity
            if (world.scoreboard.getObjective("detect:ride") !== undefined) {
                world.scoreboard.getObjective("detect:ride").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:ride").setScore(sender, 0)
                }, 1)
            }
            if (world.scoreboard.getObjective("detect:ride_entity") !== undefined) {
                world.scoreboard.getObjective("detect:ride_entity").setScore(entity, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:ride_entity").setScore(entity, 0)
                }, 1)
            }
        })
        playerGetOffAfterEvent.subscribe((data) => {
            const sender = data.player
            const entity = data.entity
            if (world.scoreboard.getObjective("detect:getoff") !== undefined) {
                world.scoreboard.getObjective("detect:getoff").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:getoff").setScore(sender, 0)
                }, 1)
            }
            if (world.scoreboard.getObjective("detect:getoff_entity") !== undefined) {
                world.scoreboard.getObjective("detect:getoff_entity").setScore(entity, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:getoff_entity").setScore(entity, 0)
                }, 1)
            }
        })
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
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:keys").setScore(sender, 2000000)
                }, 1)
            }
        })
        world.afterEvents.playerSwingStart.subscribe((data) => {
            const sender = data.player
            if (world.scoreboard.getObjective("detect:swing") !== undefined) {
                world.scoreboard.getObjective("detect:swing").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:swing").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.entityDie.subscribe((data) => {
            const sender = data.deadEntity
            const killer = data.damageSource.damagingEntity
            if (sender.typeId === "minecraft:player") {
                if (world.scoreboard.getObjective("detect:dead")) {
                    const scoreboard = world.scoreboard.getObjective("detect:dead")
                    scoreboard.setScore(sender, 1)
                    system.runTimeout(() => {
                        scoreboard.setScore(sender, 0)
                    }, 1)
                }
                if (killer !== undefined) {
                    if (world.scoreboard.getObjective("detect:kill")) {
                        const scoreboard = world.scoreboard.getObjective("detect:kill")
                        scoreboard.setScore(killer, 1)
                        system.runTimeout(() => {
                            scoreboard.setScore(killer, 0)
                        }, 1)
                    }
                }
            }
            else {
                if (killer !== undefined) {
                    if (world.scoreboard.getObjective("detect:entity_kill")) {
                        try {
                            const scoreboard = world.scoreboard.getObjective("detect:entity_kill")
                            scoreboard.setScore(killer, 1)
                            system.runTimeout(() => {
                                scoreboard.setScore(killer, 0)
                            }, 1)
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
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:input_jump_pressed").setScore(sender, 0)
                    }, 1)
                }
            }
            if (button === InputButton.Jump && newbutton === ButtonState.Released) {
                if (world.scoreboard.getObjective("detect:input_jump_released") !== undefined) {
                    world.scoreboard.getObjective("detect:input_jump_released").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:input_jump_released").setScore(sender, 0)
                    }, 1)
                }
            }
            if (button === InputButton.Sneak && newbutton === ButtonState.Pressed) {
                if (world.scoreboard.getObjective("detect:input_sneak_pressed") !== undefined) {
                    world.scoreboard.getObjective("detect:input_sneak_pressed").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:input_sneak_pressed").setScore(sender, 0)
                    }, 1)
                }
            }
            if (button === InputButton.Sneak && newbutton === ButtonState.Pressed) {
                if (world.scoreboard.getObjective("detect:input_sneak_released") !== undefined) {
                    world.scoreboard.getObjective("detect:input_sneak_released").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:input_sneak_released").setScore(sender, 0)
                    }, 1)
                }
            }
        })
        world.afterEvents.playerCancelBreakingBlock.subscribe((data) => {
            const sender = data.player
            if (world.scoreboard.getObjective("detect:cancel_breaking_block") !== undefined) {
                world.scoreboard.getObjective("detect:cancel_breaking_block").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:cancel_breaking_block").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.blockContainerClosed.subscribe((data) => {
            const sender = data.closeSource.entity
            if (sender) {
                if (world.scoreboard.getObjective("detect:block_container_closed") !== undefined) {
                    world.scoreboard.getObjective("detect:block_container_closed").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:block_container_closed").setScore(sender, 0)
                    }, 1)
                }
            }
        })
        world.afterEvents.blockContainerOpened.subscribe((data) => {
            const sender = data.openSource.entity
            if (sender) {
                if (world.scoreboard.getObjective("detect:block_container_opened") !== undefined) {
                    world.scoreboard.getObjective("detect:block_container_opened").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:block_container_opened").setScore(sender, 0)
                    }, 1)
                }
            }
        })
        world.afterEvents.entityContainerClosed.subscribe((data) => {
            const sender = data.closeSource.entity
            const entity = data.entity
            if (sender) {
                if (world.scoreboard.getObjective("detect:entity_container_closed") !== undefined) {
                    world.scoreboard.getObjective("detect:entity_container_closed").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:entity_container_closed").setScore(sender, 0)
                    }, 1)
                }
            }
            if (world.scoreboard.getObjective("detect:entity_container_closed_entity") !== undefined) {
                world.scoreboard.getObjective("detect:entity_container_closed_entity").setScore(entity, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:entity_container_closed_entity").setScore(entity, 0)
                }, 1)
            }
        })
        world.afterEvents.entityContainerOpened.subscribe((data) => {
            const sender = data.openSource.entity
            const entity = data.entity
            if (sender) {
                if (world.scoreboard.getObjective("detect:entity_container_opened") !== undefined) {
                    world.scoreboard.getObjective("detect:entity_container_opened").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:entity_container_opened").setScore(sender, 0)
                    }, 1)
                }
            }
            if (world.scoreboard.getObjective("detect:entity_container_opened_entity") !== undefined) {
                world.scoreboard.getObjective("detect:entity_container_opened_entity").setScore(entity, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:entity_container_opened_entity").setScore(entity, 0)
                }, 1)
            }
        })
        world.afterEvents.playerStartBreakingBlock.subscribe((data) => {
            const sender = data.player
            if (world.scoreboard.getObjective("detect:start_breaking_block") !== undefined) {
                world.scoreboard.getObjective("detect:start_breaking_block").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:start_breaking_block").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.entityHitBlock.subscribe((data) => {
            const sender = data.damagingEntity
            if (world.scoreboard.getObjective("detect:entity_hit_block") !== undefined) {
                world.scoreboard.getObjective("detect:entity_hit_block").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:entity_hit_block").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.entityHitEntity.subscribe((data) => {
            const sender = data.damagingEntity
            const target = data.hitEntity
            if (world.scoreboard.getObjective("detect:entity_hit_entity") !== undefined) {
                world.scoreboard.getObjective("detect:entity_hit_entity").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:entity_hit_entity").setScore(sender, 0)
                }, 1)
            }
            if (world.scoreboard.getObjective("detect:entity_hit_entity_target") !== undefined) {
                world.scoreboard.getObjective("detect:entity_hit_entity_target").setScore(target, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:entity_hit_entity_target").setScore(target, 0)
                }, 1)
            }
        })
        world.afterEvents.projectileHitBlock.subscribe((data) => {
            const sender = data.projectile
            const target = data.source
            if (world.scoreboard.getObjective("detect:projectile_hit_block") !== undefined) {
                world.scoreboard.getObjective("detect:projectile_hit_block").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:projectile_hit_block").setScore(sender, 0)
                }, 1)
            }
            if (target) {
                if (world.scoreboard.getObjective("detect:projectile_hit_block_source") !== undefined) {
                    world.scoreboard.getObjective("detect:projectile_hit_block_source").setScore(target, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:projectile_hit_block_source").setScore(target, 0)
                    }, 1)
                }
            }
        })
        world.afterEvents.projectileHitEntity.subscribe((data) => {
            const sender = data.projectile
            const target = data.source
            const hit = data.getEntityHit().entity
            if (world.scoreboard.getObjective("detect:projectile_hit_entity") !== undefined) {
                world.scoreboard.getObjective("detect:projectile_hit_entity").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:projectile_hit_entity").setScore(sender, 0)
                }, 1)
            }
            if (target) {
                if (world.scoreboard.getObjective("detect:projectile_hit_entity_source") !== undefined) {
                    world.scoreboard.getObjective("detect:projectile_hit_entity_source").setScore(target, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:projectile_hit_entity_source").setScore(target, 0)
                    }, 1)
                }
            }
            if (hit) {
                if (world.scoreboard.getObjective("detect:projectile_hit_entity_hit") !== undefined) {
                    world.scoreboard.getObjective("detect:projectile_hit_entity_hit").setScore(hit, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:projectile_hit_entity_hit").setScore(hit, 0)
                    }, 1)
                }
            }
        })
        world.afterEvents.entityItemDrop.subscribe((data) => {
            const sender = data.entity
            const items = data.items
            if (world.scoreboard.getObjective("detect:item_drop_v2") !== undefined) {
                world.scoreboard.getObjective("detect:item_drop_v2").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:item_drop_v2").setScore(sender, 0)
                }, 1)
            }
            if (world.scoreboard.getObjective("detect:item_drop_v2_item") !== undefined) {
                for (const item of items) {
                    world.scoreboard.getObjective("detect:item_drop_v2_item").setScore(item, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:item_drop_v2_item").setScore(item, 0)
                    }, 1)
                }
            }
        })
        world.afterEvents.entityStartSneaking.subscribe((data) => {
            const sender = data.entity
            if (world.scoreboard.getObjective("detect:start_sneaking") !== undefined) {
                world.scoreboard.getObjective("detect:start_sneaking").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:start_sneaking").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.entityStopSneaking.subscribe((data) => {
            const sender = data.entity
            if (world.scoreboard.getObjective("detect:stop_sneaking") !== undefined) {
                world.scoreboard.getObjective("detect:stop_sneaking").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:stop_sneaking").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.playerInventoryItemChange.subscribe((data) => {
            const sender = data.player
            if (world.scoreboard.getObjective("detect:inventory_item_change") !== undefined) {
                world.scoreboard.getObjective("detect:inventory_item_change").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:inventory_item_change").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.playerUseNameTag.subscribe((data) => {
            const sender = data.player
            const target = data.entityNamed
            if (world.scoreboard.getObjective("detect:use_nametag") !== undefined) {
                world.scoreboard.getObjective("detect:use_nametag").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:use_nametag").setScore(sender, 0)
                }, 1)
            }
            if (world.scoreboard.getObjective("detect:use_nametag_entity") !== undefined) {
                world.scoreboard.getObjective("detect:use_nametag_entity").setScore(target, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:use_nametag_entity").setScore(target, 0)
                }, 1)
            }
        })
        world.afterEvents.tripWireTrip.subscribe((data) => {
            const senders = data.sources
            if (world.scoreboard.getObjective("detect:tripwire_trip") !== undefined) {
                for (const sender of senders) {
                    world.scoreboard.getObjective("detect:tripwire_trip").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:tripwire_trip").setScore(sender, 0)
                    }, 1)
                }
            }
        })
        world.afterEvents.targetBlockHit.subscribe((data) => {
            const sender = data.source
            if (world.scoreboard.getObjective("detect:targetblcok_hit") !== undefined) {
                world.scoreboard.getObjective("detect:targetblcok_hit").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:targetblcok_hit").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.buttonPush.subscribe((data) => {
            const sender = data.source
            if (world.scoreboard.getObjective("detect:button_push") !== undefined) {
                world.scoreboard.getObjective("detect:button_push").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:button_push").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.leverAction.subscribe((data) => {
            const sender = data.player
            const bol = data.isPowered
            if (world.scoreboard.getObjective("detect:lever_action") !== undefined) {
                world.scoreboard.getObjective("detect:lever_action").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:lever_action").setScore(sender, 0)
                }, 1)
            }
            if (bol) {
                if (world.scoreboard.getObjective("detect:lever_action_on") !== undefined) {
                    world.scoreboard.getObjective("detect:lever_action_on").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:lever_action_on").setScore(sender, 0)
                    }, 1)
                }
            }
            else {
                if (world.scoreboard.getObjective("detect:lever_action_off") !== undefined) {
                    world.scoreboard.getObjective("detect:lever_action_off").setScore(sender, 1)
                    system.runTimeout(() => {
                        world.scoreboard.getObjective("detect:lever_action_off").setScore(sender, 0)
                    }, 1)
                }
            }
        })
        world.afterEvents.itemCompleteUse.subscribe((data) => {
            const sender = data.source
            if (world.scoreboard.getObjective("detect:item_complete_use") !== undefined) {
                world.scoreboard.getObjective("detect:item_complete_use").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:item_complete_use").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.itemReleaseUse.subscribe((data) => {
            const sender = data.source
            if (world.scoreboard.getObjective("detect:item_release_use") !== undefined) {
                world.scoreboard.getObjective("detect:item_release_use").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:item_release_use").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.itemStartUse.subscribe((data) => {
            const sender = data.source
            if (world.scoreboard.getObjective("detect:item_start_use") !== undefined) {
                world.scoreboard.getObjective("detect:item_start_use").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:item_start_use").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.itemStartUseOn.subscribe((data) => {
            const sender = data.source
            if (world.scoreboard.getObjective("detect:item_start_use_on") !== undefined) {
                world.scoreboard.getObjective("detect:item_start_use_on").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:item_start_use_on").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.itemStopUse.subscribe((data) => {
            const sender = data.source
            if (world.scoreboard.getObjective("detect:item_stop_use") !== undefined) {
                world.scoreboard.getObjective("detect:item_stop_use").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:item_stop_use").setScore(sender, 0)
                }, 1)
            }
        })
        world.afterEvents.itemStopUseOn.subscribe((data) => {
            const sender = data.source
            if (world.scoreboard.getObjective("detect:item_stop_use_on") !== undefined) {
                world.scoreboard.getObjective("detect:item_stop_use_on").setScore(sender, 1)
                system.runTimeout(() => {
                    world.scoreboard.getObjective("detect:item_stop_use_on").setScore(sender, 0)
                }, 1)
            }
        })
    }
    if (JSON_PLAYERS_DATA !== "") {
        if (world.getDynamicProperty("latest.playersdata") !== JSON_PLAYERS_DATA) {
            try {
                const raw = JSON.parse(JSON_PLAYERS_DATA)
                const data = playersList.getPlayersList()
                const map = new Map();
                [...raw, ...data].forEach(p => map.set(p.persistentId, p));
                const result = Array.from(map.values());
                world.setDynamicProperty("data.playersList", JSON.stringify(result))
                world.setDynamicProperty("latest.playersdata", JSON_PLAYERS_DATA)
            } catch (e) {
                console.error(`インポート中にエラーが発生しました: ${e}`)
            }
        }
    }
    if (JSON_BAN_DATA !== "") {
        if (world.getDynamicProperty("latest.bandata") !== JSON_BAN_DATA) {
            try {
                const raw = JSON.parse(JSON_BAN_DATA)
                const data = playersList.getBanList()
                const map = new Map();
                [...raw, ...data].forEach(p => map.set(p.persistentId, p));
                const result = Array.from(map.values());
                world.setDynamicProperty("data.banList", JSON.stringify(result))
                world.setDynamicProperty("latest.bandata", JSON_BAN_DATA)
            } catch (e) {
                console.error(`インポート中にエラーが発生しました: ${e}`)
            }
        }
    }
    if (BAN_QUEUE.length) {
        if (world.getDynamicProperty("latest.banqueue") === undefined) {
            try {
                const data = queue.create("ban")
                const result = [...new Set([...data.list(), ...BAN_QUEUE])];
                data.write(result)
                world.setDynamicProperty("latest.banqueue", JSON.stringify(BAN_QUEUE))
            } catch (e) {
                console.error(`インポート中にエラーが発生しました: ${e}`)
            }
        }
        else if (JSON.parse(world.getDynamicProperty("latest.banqueue")).length !== BAN_QUEUE.length) {
            try {
                const data = queue.create("ban")
                const result = [...new Set([...data.list(), ...BAN_QUEUE])];
                data.write(result)
                world.setDynamicProperty("latest.banqueue", JSON.stringify(BAN_QUEUE))
            } catch (e) {
                console.error(`インポート中にエラーが発生しました: ${e}`)
            }
        }
        else { }
    }
})

playerDropBeforeEvent.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:item_drop") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:item_drop")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (pack["command:detect_scoreboard"] === true) {
        if (world.scoreboard.getObjective("detect:item_drop") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:item_drop").setScore(sender, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:item_drop").setScore(sender, 0)
                })
            })
        }
    }
})

playerUseChestBeforeEvent.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:chest_use") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:chest_use")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (pack["command:detect_scoreboard"] === true) {
        if (world.scoreboard.getObjective("detect:chest_use") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:chest_use").setScore(sender, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:chest_use").setScore(sender, 0)
                })
            })
        }
    }
})

world.beforeEvents.entityItemPickup.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.entity
    if (sender.getDynamicProperty("minecraft:pickup") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:pickup")
        if (!enable) {
            data.cancel = true;
        }
        else {
            if (pack["command:detect_scoreboard"] === true) {
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
    const pack = world.getPackSettings()
    const sender = data.source
    if (sender.getDynamicProperty("minecraft:item_use") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:item_use")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (pack["command:detect_scoreboard"] === true) {
        if (world.scoreboard.getObjective("detect:item_use") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:item_use").setScore(sender, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:item_use").setScore(sender, 0)
                })
            })
        }
    }
})

world.beforeEvents.entityHurt.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.damageSource.damagingEntity ?? data.damageSource.damagingProjectile
    if (sender !== undefined) {
        if (sender.getDynamicProperty("minecraft:attack_entity") !== undefined) {
            const enable = sender.getDynamicProperty("minecraft:attack_entity")
            if (!enable) {
                data.cancel = true;
            }
        }
        if (pack["command:detect_scoreboard"] === true) {
            if (world.scoreboard.getObjective("detect:attack_entity") !== undefined) {
                system.run(() => {
                    world.scoreboard.getObjective("detect:attack_entity").setScore(sender, 1)
                    system.run(() => {
                        world.scoreboard.getObjective("detect:attack_entity").setScore(sender, 0)
                    })
                })
            }
        }
    }
})

world.beforeEvents.playerBreakBlock.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:break") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:break")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (pack["command:detect_scoreboard"] === true) {
        if (world.scoreboard.getObjective("detect:break") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:break").setScore(sender, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:break").setScore(sender, 0)
                })
            })
        }
    }
})

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:place") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:place")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (pack["command:detect_scoreboard"] === true) {
        if (world.scoreboard.getObjective("detect:place") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:place").setScore(sender, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:place").setScore(sender, 0)
                })
            })
        }
    }
})

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:interact_block") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:interact_block")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (pack["command:detect_scoreboard"] === true) {
        if (world.scoreboard.getObjective("detect:interact_block") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:interact_block").setScore(sender, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:interact_block").setScore(sender, 0)
                })
            })
        }
    }
})

world.beforeEvents.playerInteractWithEntity.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.player
    if (sender.getDynamicProperty("minecraft:interact_entiy") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:interact_entiy")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (pack["command:detect_scoreboard"] === true) {
        if (world.scoreboard.getObjective("detect:interact_entiy") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:interact_entiy").setScore(sender, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:interact_entiy").setScore(sender, 0)
                })
            })
        }
    }
})

world.beforeEvents.entityHeal.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.healedEntity
    if (sender !== undefined) {
        if (sender.getDynamicProperty("minecraft:healing") !== undefined) {
            const enable = sender.getDynamicProperty("minecraft:healing")
            if (!enable) {
                data.cancel = true;
            }
        }
        if (pack["command:detect_scoreboard"] === true) {
            if (world.scoreboard.getObjective("detect:healing") !== undefined) {
                system.run(() => {
                    world.scoreboard.getObjective("detect:healing").setScore(sender, 1)
                    system.run(() => {
                        world.scoreboard.getObjective("detect:healing").setScore(sender, 0)
                    })
                })
            }
        }
    }
})

world.beforeEvents.entityTamed.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.tamingEntity
    const target = data.entity
    if (sender.getDynamicProperty("minecraft:taming") !== undefined) {
        const enable = sender.getDynamicProperty("minecraft:taming")
        if (!enable) {
            data.cancel = true;
        }
    }
    if (pack["command:detect_scoreboard"] === true) {
        if (world.scoreboard.getObjective("detect:taming") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:taming").setScore(sender, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:taming").setScore(sender, 0)
                })
            })
        }
        if (world.scoreboard.getObjective("detect:tamed_entiy") !== undefined) {
            system.run(() => {
                world.scoreboard.getObjective("detect:tamed_entiy").setScore(target, 1)
                system.run(() => {
                    world.scoreboard.getObjective("detect:tamed_entiy").setScore(target, 0)
                })
            })
        }
    }
})

world.beforeEvents.explosion.subscribe((data) => {
    const pack = world.getPackSettings()
    const sender = data.source
    if (sender) {
        if (sender.getDynamicProperty("minecraft:explosion") !== undefined) {
            const enable = sender.getDynamicProperty("minecraft:explosion")
            if (!enable) {
                data.cancel = true;
            }
        }
        if (pack["command:detect_scoreboard"] === true) {
            if (world.scoreboard.getObjective("detect:explosion") !== undefined) {
                system.run(() => {
                    world.scoreboard.getObjective("detect:explosion").setScore(sender, 1)
                    system.run(() => {
                        world.scoreboard.getObjective("detect:explosion").setScore(sender, 0)
                    })
                })
            }
        }
    }
})