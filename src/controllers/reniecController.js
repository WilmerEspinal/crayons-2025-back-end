const axios = require("axios");

const buscarPersonaPorDni = async (req, res) => {
  const { dni } = req.params;

  if (!dni || dni.length !== 8) {
    return res.status(400).json({ status: false, message: "DNI inválido" });
  }

  try {
    const response = await axios.get(
      `https://api.apis.net.pe/v1/dni?numero=${dni}`,
      {
        headers: {
          Authorization:
            "Bearer apis-token-15116.UF1dVR8QDPEdTUmEE7HvvqqKvvglNodx",
        },
      }
    );

    return res.json({
      status: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error al buscar persona por DNI:", error.message);
    return res.status(500).json({
      status: false,
      message: "Error al buscar persona",
    });
  }
};

module.exports = {
  buscarPersonaPorDni,
};
