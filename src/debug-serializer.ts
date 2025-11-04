const { Serializer } = require("./core/analysis/models/serialization/Serializer")
const { SerializationFormat } = require("./core/analysis/models/serialization/SerializationFormat")

async function debugSerializer() {
	console.log("Starting serializer debug...")

	const serializer = new Serializer()
	const testData = {
		id: "test-item",
		name: "测试项目",
		configId: "test-config",
		status: "completed",
		duration: 5000,
	}

	console.log("Test data:", testData)

	// 序列化
	const serialized = await serializer.serialize(testData, {
		format: SerializationFormat.JSON,
		compress: false,
		encrypt: false,
		prettyPrint: true,
	})

	console.log("Serialized result:", serialized)

	if (!serialized.success) {
		console.error("Serialization failed:", serialized.errors)
		return
	}

	console.log("Serialized data type:", typeof serialized.data)
	console.log("Serialized data preview:", serialized.data.substring(0, 100))

	// 反序列化
	const deserialized = await serializer.deserialize(serialized.data, {
		format: SerializationFormat.JSON,
		decompress: false,
		decrypt: false,
	})

	console.log("Deserialized result:", deserialized)

	if (!deserialized.success) {
		console.error("Deserialization failed:", deserialized.errors)
	} else {
		console.log("Deserialized data:", deserialized.data)
	}
}

debugSerializer().catch(console.error)
