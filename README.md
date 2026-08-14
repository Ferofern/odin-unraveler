# Editable Odin Case Files

Actúa como un desarrollador frontend experto. Desarrolla una webapp interactiva en un solo archivo (HTML con CSS y JavaScript integrados), diseñada para funcionar como una presentación dinámica de un caso judicial de lavado de activos (Caso Odín).




Requisitos Visuales y de Diseño:




Paleta de colores: Estrictamente concho de vino (borgoña oscuro/vino tinto), blanco y negro. Un diseño sobrio, legal y moderno.

Instrucciones para el Fondo (Background): Implementa un fondo oscuro (#0a0a0a) que incluya una textura visual sutil relacionada con el análisis forense y financiero. Crea una cuadrícula técnica muy fina de baja opacidad utilizando linear-gradient en CSS. Adicionalmente, integra mediante CSS una marca de agua tipográfica estática y muy tenue (opacidad mínima) que repita el texto "EXPEDIENTE: CASO ODÍN - ART. 317" usando una fuente serif clásica, dándole peso de investigación judicial.

Estructura Visual Principal: La pantalla inicial debe mostrar círculos flotantes animados suavemente (nodos). Cada círculo principal representará a un implicado del caso.

Interactividad y Navegación:




Al hacer clic en el círculo de un implicado, deben desplegarse a su alrededor sub-círculos más pequeños que contengan el título corto de cada una de sus acusaciones.

Al hacer clic en uno de estos sub-círculos de acusación, debe aparecer un panel lateral o un modal estilizado que muestre el desglose completo de esa acusación: La Justificación, La Prueba y Las Gestiones por realizar.

Restricciones Técnicas:




Utiliza HTML, CSS y Vanilla JavaScript. Si requieres una librería para la física de los círculos flotantes y los nodos interactivos, puedes integrar D3.js o Vis.js mediante CDN.

REGLA ABSOLUTA: No debes incluir absolutamente ningún comentario dentro del código generado (ni en HTML, ni en CSS, ni en JavaScript). Entrega el código completamente limpio.

Datos a inyectar (Formato de esquema para los nodos):




Delito General: Lavado de activos (317 IN. 1 INC. 1). Activos de origen ilícito.




Implicados y sus acusaciones:




1. PATRICIA MERCEDES TAPIA MACIAS




Acusación 1: Año 2022 - Solar 12 de la manzana 287, parroquia Febres Cordero, Guayaquil.




Justificación: Valor $4,871 pagado entre 2015 y 2017 a la MIMG; compraventa autorizada en 2015, transferencia en 2022 por bien ya pagado.

Pruebas: Foja 1246 (C/V Municipio), Foja 1043 (Certificado Registro de Propiedad), Foja 3954 (BCN Estados de cuenta 2011-2012), Foja 5217 (Préstamos BCN 2010-2011), Foja 5311 (Respuesta MIMG), Foja 5627 (Mecanizado IESS, último pago enero 2016).

Acusación 2: Año 2024 - Compra Nissan Versa, placas GPS-7533.




Justificación: Trabajó 14 años en la función judicial ganando de $600 a $1,600 mensuales.

Pruebas: Foja 4250 (Respuesta FACJ años de servicio 2001-2015), Foja 5627 (Mecanizado IESS).

Gestiones: Solicitar liquidación por los 14 años de servicio.

Acusación 3: Año 2025 - Oficina Cien Olivos parc, sin registrar.




Justificación: Valor $80,000 cancelado mediante cheque.

Pruebas: Foja 1808 (Compraventa del bien), Peritaje económico financiero.

Gestiones: Versiones a vendedores Dieter Gerardo Koeh Santiestevan y José Luis Valero Del Hierro.

Acusación 4: Año 2025 - Ingresos inusuales de $88,360 no justificados.




Justificación: $80,000 corresponden al dinero de la compra de la casa transferido por un tercero.

Gestiones: Solicitar Pericia Financiera y Contable.

Acusación 5: Año 2025 - Presidenta de Petro&logic.

2. JACQUELINE NAOMI NAULA GONZALEZ




Acusación 1: Año 2021 - Compra Chevrolet Cavalier placa GCB7796 por $15,500.




Justificación: Trabajo entre agosto y diciembre generó $1,878.15.

Pruebas: Foja 441 (Mecanizado IESS), Foja 5584 (Respuesta Coheco).

Gestiones: Insistir en Montepío IESS.

Acusación 2: Año 2022 - Vende mediante fideicomiso KIA STONIC placa PDR4892 por $20,300.




Justificación: Pago en efectivo.

Pruebas: Foja 2919 (Respuesta Fideval con Compraventa).

Acusación 3: Año 2022 - Accionista de Petro&Logic.




Gestiones: Pericia Financiera Técnico.

Acusación 4: Año 2022 - Compra Chevrolet Captiva Premier placa GT13725 por $24,235.59.




Gestiones: Versión del representante de CORPORACION NEXUM NEXUMCORP S.A., Versión Moreira Dávila Andrés José, Versión Coronel Beltrán Luis Joaquín.

Acusación 5: Año 2023 - Compra Toyota Rush por $30,999 (múltiples depósitos).




Justificación: Ingreso de trabajo 2023 por $8,372; deuda de pagaré a la orden.

Pruebas: Foja 1962 (Respuesta Toyocosta), Foja 3030 (Respuesta Toyocosta depósitos), Foja 5280 (Respuesta Tolepu).

Acusación 6: Año 2023 - Transferencia recibida por $20,732.80.




Justificación: Reliquidación de la pensión del papá donde es apoderada.

Pruebas: Foja 3070 (Respuesta Min. Economía), Foja 5578 (Certificación dirección distrital).

Acusación 7: Año 2023 - Vende Chevrolet Captiva GT13725 por $15,500.




Pruebas: Foja 1861 (C/V Captiva).

Gestiones: Versión del comprador Dennys Brayan Reyna Bravo.

Acusación 8: Año 2025 - Compraventa terreno en San José, Naranjito por $40,000.




Pruebas: Foja 2654 (Escritura Notaría con transferencia de $40,000).

Gestiones: Versión Marco Antonio Guerrero Jimenez.

3. JACQUELINE DEL CARMEN GONZÁLEZ SUÁREZ




Acusación 1: Año 2020 - Compra casa en Samanes V por $57,108.00.




Justificación: Compra con dinero de compraventas de casas de Sauces.

Pruebas: Foja 5587 (C/V de la casa), Foja 4220, Foja 4264 (Respuesta Consejo de Judicatura).

Acusación 2: Año 2021 - Compra inmueble en Gral. Villamil, Playas por $200,000.




Justificación: El esposo pagó a vendedores, transferencia post mortem.

Pruebas: Foja 593 (Historia de dominio), Foja 2614 (Compraventa Notaría), Foja 5242 (Versión Enrique Parrales).

Acusación 3: Año 2023 - Compra inmueble en La Aurora (Vicriel) por $165,000.




Justificación: Pagado con venta de joyas/oro del esposo y madre.

Pruebas: Foja 521 (Historia de dominio), Foja 2136 (Escritura Compraventa).

Gestiones: Versiones de Peter Fuentes y Francis Escobar, Cheques certificados, Oficiar a compradores de joyas, Préstamo quirografario.

Acusación 4: Año 2024 - Vende inmueble en Samanes V por $85,733.00.




Justificación: El pago lo recibe Daniel.

Pruebas: Foja 1070 (Registro de Propiedad), Foja 2161 y 3383 (Escritura Compraventa).

4. DANIEL ADOLFO NAULA GONZÁLEZ




Acusación 1: Desproporción de ingresos 2018-2025.




Justificación: Trabajos independientes pagados en efectivo.

Gestiones: Solicitar estados de cuenta a Banco Pichincha, Oficiar a Petrologic S.A.

Acusación 2: Ingreso de dinero en efectivo por $136,616.28.




Justificación: Hacía servicio de courier.

Gestiones: Oficiar a empresa de Courier, Materialización de Facebook, Versiones de 7 clientes específicos.

Acusación 3: Año 2019 - Compra Nissan Xtrail por $23,500.




Pruebas: Foja 1518 (Respuesta Automotores y Anexos).

Acusación 4: Año 2020 - Compra de Yate Michelle 2.




Pruebas: Foja 2389 (C/V Compra), Foja 1879 (C/V Venta).

Gestiones: Versión Oliver Panchana.

Acusación 5: Año 2022 - Compra vehículo TUNDRA por $23,500.




Justificación: Nunca estuvo a su nombre, depósitos con cédula robada.

Pruebas: Foja 1536 (Respuesta Primatrade S.A.).

Gestiones: Certificación de documentos extraviados, Pericia Grafológica, Versión comprador original.

Acusación 6: Conexión caso metástasis.




Pruebas: Foja 4243 (Respuesta Corte Nacional de Justicia, no vinculación).

Acusación 7: Año 2024 - Depósito por $85,733.00.




Gestiones: Declaración juramentada por diputación al pago de parte de la madre.

Acusación 8: Año 2024 - Compra Vistana 300.




Pruebas: Foja 3874, Foja 4038 (Respuesta Banco Pichincha), Foja 4182 (Tabla de amortización), Foja 4100 (Pagos).

Gestiones: Certificaciones de transferencias, Certificación bancaria sobre póliza, Versión Melissa Pazmiño.

Genera el código necesario para cumplir con todas estas directrices y mostrar la totalidad de la información.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ad6c45b0-4cfa-44ec-95d2-13ad59ba6589).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
