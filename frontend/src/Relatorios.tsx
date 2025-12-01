import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { type Aeronave } from "./types";

interface OutletContextType {
  aeronaves: Aeronave[];
}

function Relatorios() {
  const { aeronaves } = useOutletContext<OutletContextType>();
  const [selectedAeronaveId, setSelectedAeronaveId] = useState<string>("");
  const [relatorioAutor, setRelatorioAutor] =
    useState<string>("Usuário Padrão");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const generateTextReport = (data: any, autor: string): string => {
    let report = `--- RELATÓRIO DE APROVAÇÃO DA AERONAVE ---\n`;
    report += `Gerado em: ${new Date().toLocaleString()}\n`;
    report += `Autor: ${autor}\n`;
    report += `\n======================================\n\n`;

    report += `DADOS DA AERONAVE:\n`;
    report += `  Código: ${data.aeronave.codigo}\n`;
    report += `  Modelo: ${data.aeronave.modelo}\n`;
    report += `  Tipo: ${data.aeronave.tipo}\n`;
    report += `  Capacidade: ${data.aeronave.capacidade}\n`;
    report += `  Autonomia: ${data.aeronave.autonomia}\n\n`;

    report += `PEÇAS INSTALADAS (${data.aeronave.pecas.length}):\n`;
    data.aeronave.pecas.forEach((p: any) => {
      report += `  - ID: ${p.id}, Nome: ${p.nome}, Fornecedor: ${p.fornecedor}, Status: ${p.status}\n`;
    });
    report += `\n======================================\n\n`;

    report += `ETAPAS DE PRODUÇÃO (${data.aeronave.etapas.length} CONCLUÍDAS):\n`;
    data.aeronave.etapas.forEach((e: any) => {
      const funcionariosNomes = e.funcionarios
        .map((f: any) => `${f.funcionario.nome} (${f.funcionario.cargo})`)
        .join("; ");
      report += `  - ID: ${e.id}, Nome: ${e.nome}, Data Prevista: ${new Date(
        e.dataPrevista
      ).toLocaleDateString()}, Status: ${e.status}\n`;
      report += `    Funcionários: ${funcionariosNomes || "Nenhum"}\n`;
    });
    report += `\n======================================\n\n`;

    report += `HISTÓRICO DE TESTES (${data.aeronave.testes.length} registros):\n`;
    data.aeronave.testes.forEach((t: any) => {
      report += `  - Tipo: ${t.tipo}, Resultado: ${
        t.resultado
      }, Data: ${new Date(t.data).toLocaleString()}\n`;
    });
    report += `\n--- FIM DO RELATÓRIO ---\n`;

    return report;
  };

  const downloadTxtFile = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFetchError(null);
    setIsGenerating(true);

    if (!selectedAeronaveId) {
      setFetchError("Por favor, selecione uma Aeronave.");
      setIsGenerating(false);
      return;
    }

    const dadosRelatorio = {
      aeronaveId: selectedAeronaveId,
      autor: relatorioAutor,
    };

    try {
      const response = await fetch("http://localhost:3000/gerarRelatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosRelatorio),
      });

      const data = await response.json();

      if (response.ok) {
        const reportText = generateTextReport(data, dadosRelatorio.autor);
        const filename = `Relatorio_Aeronave_${
          data.aeronave.codigo
        }_${data.aeronave.modelo.replace(/\s/g, "_")}.txt`;

        downloadTxtFile(reportText, filename);
        setFetchError(
          `Relatório de ${data.aeronave.modelo} gerado e exportado com sucesso!`
        );
      } else {
        setFetchError(
          data.error || "Falha ao gerar relatório. Verifique os pré-requisitos."
        );
      }
    } catch (error) {
      setFetchError(
        "Erro de conexão com o servidor. Verifique se o backend está rodando."
      );
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h1>Geração de Relatórios</h1>

      {fetchError && (
        <div
          className={`p-4 mb-4 rounded-lg text-white ${
            fetchError.includes("sucesso") ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {fetchError}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="aeronaveId">Selecione a Aeronave</label>
            <select
              id="aeronaveId"
              name="aeronaveId"
              value={selectedAeronaveId}
              onChange={(e) => setSelectedAeronaveId(e.target.value)}
              required
              disabled={isGenerating}
            >
              <option value="">-- Selecione --</option>
              {aeronaves.map((a) => (
                <option key={a.codigo} value={a.codigo}>
                  {a.modelo} ({a.codigo})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="autor">Autor do Relatório</label>
            <input
              type="text"
              id="autor"
              name="autor"
              value={relatorioAutor}
              onChange={(e) => setRelatorioAutor(e.target.value)}
              required
              disabled={isGenerating}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isGenerating || !selectedAeronaveId}
          >
            {isGenerating ? "Gerando..." : "Gerar Relatório"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Relatorios;
