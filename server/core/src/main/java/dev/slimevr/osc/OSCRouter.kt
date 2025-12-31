package dev.slimevr.osc

import com.illposed.osc.*
import com.illposed.osc.messageselector.OSCPatternAddressMessageSelector
import com.illposed.osc.transport.OSCPortIn
import com.illposed.osc.transport.OSCPortOut
import dev.slimevr.config.OSCConfig
import io.eiren.util.collections.FastList
import io.eiren.util.logging.LogManager
import java.io.IOException
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.UnknownHostException

class OSCRouter(
	private val config: OSCConfig,
	private val oscHandlers: FastList<OSCHandler>,
) {
	private var oscReceiver: OSCPortIn? = null
	private var oscSender: OSCPortOut? = null
	private var lastPortIn = 0
	private var lastPortOut = 0
	private var lastAddress: InetAddress? = null
	private var timeAtLastError: Long = 0

	init {
		refreshSettings(false)
	}

	fun refreshSettings(refreshHandlersSettings: Boolean) {
		if (refreshHandlersSettings) {
			for (oscHandler in oscHandlers) {
				oscHandler.refreshSettings(false)
			}
		}

		// Stops listening and closes OSC port
		val wasListening = oscReceiver != null && oscReceiver!!.isListening
		if (wasListening) {
			oscReceiver!!.stopListening()
		}
		oscReceiver = null
		val wasConnected = oscSender != null && oscSender!!.isConnected
		if (wasConnected) {
			try {
				oscSender!!.close()
			} catch (e: IOException) {
				LogManager.severe("[OSCRouter] Error closing the OSC sender: $e")
			}
		}
		oscSender = null

		if (config.enabled) {
			// Instantiates the OSC receiver
			val portIn = config.portIn
			// Check if another OSC receiver with same port exists
			for (oscHandler in oscHandlers) {
				if (oscHandler.portIn == portIn) {
					if (oscHandler.oscReceiver!!.isListening) {
						oscReceiver = oscHandler.oscReceiver
						LogManager.info("[OSCRouter] Listening to port $portIn")
					}
				}
			}
			// Else, create our own OSC receiver
			if (oscReceiver == null) {
				try {
					oscReceiver = OSCPortIn(portIn)
					if (lastPortIn != portIn || !wasListening) {
						LogManager.info("[OSCRouter] Listening to port $portIn")
					}
					lastPortIn = portIn
				} catch (e: IOException) {
					LogManager
						.severe(
							(
								"[OSCRouter] Error listening to the port " +
									config.portIn +
									": " +
									e
								),
						)
				}
			}

			// Instantiate the OSC sender
			val portOut = config.portOut
			val address: InetAddress
			try {
				address = InetAddress.getByName(config.address)
			} catch (e: UnknownHostException) {
				throw RuntimeException(e)
			}
			// Check if another OSC sender with same port and address exists
			for (oscHandler in oscHandlers) {
				if (oscHandler.portOut == portOut && oscHandler.address === address) {
					if (oscHandler.oscSender!!.isConnected) {
						oscSender = oscHandler.oscSender
						LogManager
							.info(
								(
									"[OSCRouter] Sending to port " +
										portOut +
										" at address " +
										address.toString()
									),
							)
					}
				}
			}
			// Else, create our own OSC sender
			if (oscSender == null) {
				try {
					oscSender = OSCPortOut(InetSocketAddress(address, portOut))
					if ((lastPortOut != portOut && lastAddress !== address) || !wasConnected) {
						LogManager
							.info(
								(
									"[OSCRouter] Sending to port " +
										portOut +
										" at address " +
										address.toString()
									),
							)
					}
					lastPortOut = portOut
					lastAddress = address

					oscSender!!.connect()
				} catch (e: IOException) {
					LogManager
						.severe(
							(
								"[OSCRouter] Error connecting to port " +
									config.portOut +
									" at the address " +
									config.address +
									": " +
									e
								),
						)
				}
			}

			// Starts listening to messages
			if (oscReceiver != null) {
				val listener = OSCMessageListener { event: OSCMessageEvent? -> this.handleReceivedMessage(event!!) }
				// Listens for any message ("//" is a wildcard)
				val selector: MessageSelector = OSCPatternAddressMessageSelector("//")
				oscReceiver!!.dispatcher.addListener(selector, listener)
				if (!oscReceiver!!.isListening) oscReceiver!!.startListening()
			}
		}
	}

	fun handleReceivedMessage(event: OSCMessageEvent) {
		if (oscSender != null && oscSender!!.isConnected) {
			val oscMessage = OSCMessage(
				event.message.address,
				event.message.arguments,
			)
			try {
				oscSender!!.send(oscMessage)
			} catch (e: IOException) {
				// Avoid spamming AsynchronousCloseException too many
				// times per second
				if (System.currentTimeMillis() - timeAtLastError > 100) {
					timeAtLastError = System.currentTimeMillis()
					LogManager
						.warning(
							"[OSCRouter] Error sending OSC packet: " +
								e,
						)
				}
			} catch (e: OSCSerializeException) {
				if (System.currentTimeMillis() - timeAtLastError > 100) {
					timeAtLastError = System.currentTimeMillis()
					LogManager
						.warning(
							"[OSCRouter] Error sending OSC packet: " +
								e,
						)
				}
			}
		}
	}
}

