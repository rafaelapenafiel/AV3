import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { tipoTeste, type Aeronave } from "./types";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 font-bold"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface Teste {
  id: number;
  tipo: tipoTeste;
  data: string;
  resultado: "Aprovado" | "Reprovado";
  aeronaveId: number;
}

interface OutletContextType {
  aeronaves: Aeronave[];
}

function Testes() {
  const { aeronaves } = useOutletContext<OutletContextType>();
  const [selectedAeronaveId, setSelectedAeronaveId] = useState<number | null>(
    null
  );
  const [testesHistorico, setTestesHistorico] = useState<Teste[]>([]);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchHistorico = async (aeronaveId: number) => {
    setFetchError(null);
    try {
      const response = await fetch(
        `http://localhost:3000/testes/${aeronaveId}`
      );
      if (response.ok) {
        const data = await response.json();
        setTestesHistorico(data);
        if (data.length === 0) {
          setFetchError("Nenhum teste encontrado para a aeronave selecionada.");
        } else {
          setFetchError(null);
        }
      } else {
        setFetchError(
          "Falha ao carregar o histórico de testes. Tente novamente mais tarde."
        );
        setTestesHistorico([]);
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      setFetchError(
        "Erro de conexão com o servidor. Verifique se o backend está rodando."
      );
      setTestesHistorico([]);
    }
  };

  useEffect(() => {
    if (selectedAeronaveId && selectedAeronaveId !== 0) {
      fetchHistorico(selectedAeronaveId);
    } else {
      setTestesHistorico([]);
      setFetchError(null);
    }
  }, [selectedAeronaveId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFetchError(null);
    const formData = new FormData(e.currentTarget);

    const aeronaveIdValue = Number(formData.get("aeronaveId"));

    const dadosTeste = {
      aeronaveId: aeronaveIdValue,
      tipo: formData.get("tipoTeste") as tipoTeste,
      resultado: formData.get("resultado") as "Aprovado" | "Reprovado",
      data: new Date().toISOString(),
    };

    if (!dadosTeste.aeronaveId || dadosTeste.aeronaveId === 0) {
      setFetchError("Por favor, selecione uma Aeronave.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/teste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosTeste),
      });

      if (!response.ok) {
        const data = await response.json();
        setFetchError(
          "Falha ao registrar teste: " + (data.error || "Erro desconhecido")
        );
        return;
      }

      await fetchHistorico(dadosTeste.aeronaveId);
      setFetchError("Resultado do teste registrado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar:", error);
      setFetchError("Erro ao conectar com o servidor para registrar o teste.");
      return;
    }
  };

  const handleAeronaveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedAeronaveId(id);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("pt-BR");
  };

  return (
    <div>
      <h1>Controle de Qualidade (Testes)</h1>

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
              required
              onChange={handleAeronaveChange}
              value={selectedAeronaveId ?? ""}
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
            <label htmlFor="tipoTeste">Tipo de Teste</label>
            <select id="tipoTeste" name="tipoTeste" required>
              <option value="">-- Selecione --</option>
              {Object.values(tipoTeste).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Resultado</label>
            <select name="resultado" required>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
            </select>
          </div>

          <div className="flex justify-between mt-4">
            <button type="submit" className="btn-primary">
              Registrar Teste
            </button>

            {selectedAeronaveId && selectedAeronaveId !== 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsHistoricoModalOpen(true)}
              >
                Consultar Histórico de Testes
              </button>
            )}
          </div>
        </form>
      </div>

      <Modal
        title={`Histórico de Testes - Aeronave ${selectedAeronaveId}`}
        isOpen={isHistoricoModalOpen}
        onClose={() => setIsHistoricoModalOpen(false)}
      >
        <div className="historico-list">
          {testesHistorico.length === 0 ? (
            <p className="text-gray-500">
              Nenhum teste registrado para esta aeronave no momento.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Resultado</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {testesHistorico.map((t) => (
                  <tr key={t.id}>
                    <td>{t.tipo}</td>
                    <td
                      className={
                        t.resultado === "Aprovado"
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {t.resultado}
                    </td>
                    <td>{formatDate(t.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Testes;
