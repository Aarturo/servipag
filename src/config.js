'use strict';

import path from 'path';

module.exports = {
  rutallaveprivada: process.env.RUTALLAVEPRIVADA || path.join(__dirname, '..', 'test', 'llaves', 'privadaprueba.key'),
  rutallavepublica: process.env.RUTALLAVEPUBLICA || path.join(__dirname, '..', 'test', 'llaves', 'publicaprueba.key'),
  ordenfirma: process.env.ORDENFIRMA || ['Boleta', 'CodigoCanalPago', 'FechaPago', 'FechaVencimiento', 'Identificador', 'IdSubTx', 'Monto', 'MontoTotalDeuda', 'NumeroBoletas'],
  ordennodoxml2: process.env.ORDENNODOXML2 || ['IdTrxServipag', 'IdTxCliente', 'Monto'],
  ordennodoxml4: process.env.ORDENNODOXML4 || ['IdTrxServipag', 'IdTxCliente']
};
