package dev.slimevr.osc

import com.illposed.osc.transport.OSCPortIn
import com.illposed.osc.transport.OSCPortOut
import java.net.InetAddress

interface OSCHandler {
	fun refreshSettings(refreshRouterSettings: Boolean)

	fun updateOscReceiver(portIn: Int, args: Array<String>)

	fun updateOscSender(portOut: Int, address: String)

	fun update()

	val oscSender: OSCPortOut?

	val portOut: Int

	val address: InetAddress?

	val oscReceiver: OSCPortIn?

	val portIn: Int
}
