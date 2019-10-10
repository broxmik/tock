/*
 * Copyright (C) 2017 VSCT
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package ai.tock.bot.connector.messenger.model.handover

import com.fasterxml.jackson.annotation.JsonProperty
import ai.tock.bot.connector.messenger.model.Recipient

/**
 * See [https://developers.facebook.com/docs/messenger-platform/reference/handover-protocol].
 */
data class ThreadControlRequest(
    val metadata : String,
    val recipient:Recipient?,
    @JsonProperty("target_app_id") val targetAppId: String
)