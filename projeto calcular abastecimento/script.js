function obterHistorico() {
	return JSON.parse(localStorage.getItem("historicoAbastecimento") || "[]");
}

function salvarHistorico(registro) {
	const historico = obterHistorico();
	historico.unshift(registro);
	localStorage.setItem("historicoAbastecimento", JSON.stringify(historico));
}

function renderizarHistorico() {
	const historico = obterHistorico();
	const lista = document.getElementById("history");

	if (historico.length === 0) {
		lista.innerHTML =
			'<li style="color: gray;">Nenhum registro encontrado.</li>';
		return;
	}

	lista.innerHTML = historico
		.map(
			(item, index) => `
				<li class="history-item">
					<div class="history-item-content">
						<strong>${item.titulo}</strong><br>
						${item.descricao}
					</div>
					<button onclick="removerHistorico(${index})" class="btn-remover">Remover</button>
				</li>
			`,
		)
		.join("");
}

function removerHistorico(index) {
	const historico = obterHistorico();
	historico.splice(index, 1);
	localStorage.setItem("historicoAbastecimento", JSON.stringify(historico));
	renderizarHistorico();
}

function exibirErro(mensagem) {
	document.getElementById("result").innerHTML =
		`<p style="color: red;">${mensagem}</p>`;
}

function exibirResultado(html) {
	document.getElementById("result").innerHTML =
		`<div class="result-box">${html}</div>`;
}

function formatarData(data, incluirSemana) {
	const opcoes = incluirSemana
		? { weekday: "long", year: "numeric", month: "long", day: "numeric" }
		: { year: "numeric", month: "2-digit", day: "2-digit" };

	return new Date(data).toLocaleDateString("pt-BR", opcoes);
}

function calcularPorAutonomia() {
	const lastFuelDateInput = document.getElementById("lastFuelDate").value;
	const currentAutonomy = parseFloat(
		document.getElementById("currentAutonomy").value,
	);
	const avgDailyDistance = parseFloat(
		document.getElementById("avgDailyDistance").value,
	);

	if (!lastFuelDateInput || isNaN(currentAutonomy) || isNaN(avgDailyDistance)) {
		exibirErro("Por favor, preencha todos os campos do modo por autonomia.");
		return;
	}

	if (currentAutonomy <= 0 || avgDailyDistance <= 0) {
		exibirErro(
			"Autonomia atual e distância média diária devem ser maiores que zero.",
		);
		return;
	}

	const lastFuelDate = new Date(lastFuelDateInput);
	const diasRestantes = currentAutonomy / avgDailyDistance;
	const nextFuelDate = new Date(lastFuelDate);
	nextFuelDate.setDate(nextFuelDate.getDate() + Math.ceil(diasRestantes));

	const dataFormatada = formatarData(nextFuelDate, true);
	const dataAbastecimento = formatarData(lastFuelDateInput, false);

	exibirResultado(`
		<p><strong>Análise por autonomia atual:</strong></p>
		<p>Autonomia atual: <strong>${currentAutonomy.toFixed(2)} km</strong></p>
		<p>Dias até próximo abastecimento: <strong>${diasRestantes.toFixed(1)} dias</strong></p>
		<p>Data estimada do próximo abastecimento: <strong>${dataFormatada}</strong></p>
	`);

	salvarHistorico({
		titulo: `Cálculo por autonomia em ${dataAbastecimento}`,
		descricao: `Autonomia atual: ${currentAutonomy.toFixed(2)} km | Média diária: ${avgDailyDistance.toFixed(2)} km/dia | Próximo abastecimento: ${dataFormatada}`,
	});
}

function calcularPorAbastecimento() {
	const refuelDateInput = document.getElementById("refuelDate").value;
	const refuelValue = parseFloat(document.getElementById("refuelValue").value);
	const litersFilled = parseFloat(
		document.getElementById("litersFilled").value,
	);
	const pricePerLiter = parseFloat(
		document.getElementById("pricePerLiter").value,
	);
	const averageConsumption = parseFloat(
		document.getElementById("averageConsumption").value,
	);
	const dailyDistanceByRefuel = parseFloat(
		document.getElementById("dailyDistanceByRefuel").value,
	);

	if (
		!refuelDateInput ||
		isNaN(refuelValue) ||
		isNaN(litersFilled) ||
		isNaN(pricePerLiter) ||
		isNaN(averageConsumption) ||
		isNaN(dailyDistanceByRefuel)
	) {
		exibirErro(
			"Por favor, preencha todos os campos do modo por abastecimento.",
		);
		return;
	}

	if (
		refuelValue <= 0 ||
		litersFilled <= 0 ||
		pricePerLiter <= 0 ||
		averageConsumption <= 0 ||
		dailyDistanceByRefuel <= 0
	) {
		exibirErro(
			"Todos os valores do modo por abastecimento devem ser maiores que zero.",
		);
		return;
	}

	const valorCalculado = litersFilled * pricePerLiter;
	const diferenca = Math.abs(valorCalculado - refuelValue);
	const autonomiaEstimada = litersFilled * averageConsumption;
	const diasRestantes = autonomiaEstimada / dailyDistanceByRefuel;
	const nextFuelDate = new Date(refuelDateInput);
	nextFuelDate.setDate(nextFuelDate.getDate() + Math.ceil(diasRestantes));

	const dataFormatada = formatarData(nextFuelDate, true);
	const dataAbastecimento = formatarData(refuelDateInput, false);

	exibirResultado(`
		<p><strong>Análise por valor e litros abastecidos:</strong></p>
		<p>Autonomia estimada do abastecimento: <strong>${autonomiaEstimada.toFixed(2)} km</strong></p>
		<p>Dias até próximo abastecimento: <strong>${diasRestantes.toFixed(1)} dias</strong></p>
		<p>Data estimada do próximo abastecimento: <strong>${dataFormatada}</strong></p>
		<p>Conferência do valor informado: <strong>R$ ${valorCalculado.toFixed(2)}</strong> calculados pelos litros e preço por litro.</p>
		<p>Diferença para o valor total informado: <strong>R$ ${diferenca.toFixed(2)}</strong></p>
	`);

	salvarHistorico({
		titulo: `Cálculo por abastecimento em ${dataAbastecimento}`,
		descricao: `Litros: ${litersFilled.toFixed(2)} L | Valor total: R$ ${refuelValue.toFixed(2)} | Consumo médio: ${averageConsumption.toFixed(2)} km/l | Próximo abastecimento: ${dataFormatada}`,
	});
}

function atualizarModoCalculo() {
	const mode = document.getElementById("calculationMode").value;
	const autonomyFields = document.getElementById("autonomyFields");
	const refuelFields = document.getElementById("refuelFields");

	autonomyFields.classList.toggle("hidden", mode !== "autonomia");
	refuelFields.classList.toggle("hidden", mode !== "abastecimento");
}

function calcularAbastecimento() {
	const mode = document.getElementById("calculationMode").value;

	if (mode === "abastecimento") {
		calcularPorAbastecimento();
	} else {
		calcularPorAutonomia();
	}

	renderizarHistorico();
}

document
	.getElementById("calculationMode")
	.addEventListener("change", atualizarModoCalculo);

document
	.getElementById("fuelForm")
	.addEventListener("submit", function (event) {
		event.preventDefault();
		calcularAbastecimento();
	});

atualizarModoCalculo();
renderizarHistorico();
