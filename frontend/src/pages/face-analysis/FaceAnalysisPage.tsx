import React, { useEffect, useState } from 'react';
import { aiService, FaceAnalysisResult } from '../../services/ai.service';
import { getErrorMessage } from '../../services/api';
import { Sparkles, Upload, Camera, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

const FaceAnalysisPage: React.FC = () => {
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'ANALYZING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setStatus('UPLOADING');
    setError('');

    try {
      // Note: This is a placeholder - actual implementation would upload the image
      // For now, we'll simulate the analysis
      setStatus('ANALYZING');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock result - replace with actual API call when available
      setResult({
        status: 'COMPLETED',
        faceShape: 'Ovale',
        hairTexture: 'Bouclé',
        hairDensity: 'Moyenne',
        recommendations: [],
        message: 'Analyse complétée avec succès'
      });
      
      setStatus('COMPLETED');
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors de l\'analyse'));
      setStatus('FAILED');
    }
  };

  const resetAnalysis = () => {
    setStatus('IDLE');
    setResult(null);
    setError('');
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen bg-[#07090E]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Intelligence Artificielle</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Analyse Visage IA</h1>
          <p className="text-slate-400">
            Uploadez une photo de votre visage pour obtenir des recommandations de coiffures personnalisées
          </p>
        </div>

        {/* Main Content */}
        <div className="glass-panel rounded-2xl p-8">
          {status === 'IDLE' && (
            <div className="text-center">
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 hover:border-amber-500/50 transition-colors">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-2">Uploadez votre photo</p>
                    <p className="text-slate-400 text-sm mb-4">
                      PNG, JPG jusqu'à 10MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white font-semibold cursor-pointer transition-all"
                    >
                      <Camera className="h-5 w-5" />
                      Choisir une photo
                    </label>
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="mt-6">
                  <p className="text-slate-300 mb-4">Photo sélectionnée: {selectedFile.name}</p>
                  <button
                    onClick={handleAnalyze}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold transition-all"
                  >
                    Lancer l'analyse
                  </button>
                </div>
              )}
            </div>
          )}

          {(status === 'UPLOADING' || status === 'ANALYZING') && (
            <div className="text-centerpy-12">
              <Loader2 className="h-12 w-12 animate-spin text-violet-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">
                {status === 'UPLOADING' ? 'Upload en cours...' : 'Analyse en cours...'}
              </p>
              <p className="text-slate-400 text-sm">
                Notre IA analyse votre morphologie faciale
              </p>
            </div>
          )}

          {status === 'FAILED' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Erreur</h3>
              <p className="text-slate-400 mb-6">{error}</p>
              <button
                onClick={resetAnalysis}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          {status === 'COMPLETED' && result && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Analyse terminée</h3>
                  <p className="text-slate-400 text-sm">{result.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <ResultCard label="Forme du visage" value={result.faceShape} />
                <ResultCard label="Texture des cheveux" value={result.hairTexture} />
                <ResultCard label="Densité" value={result.hairDensity} />
              </div>

              <div className="text-center">
                <button
                  onClick={resetAnalysis}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
                >
                  Nouvelle analyse
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Comment ça marche ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Step number={1} title="Uploadez" description="Prenez une photo de face ou uploadez-en une" />
            <Step number={2} title="Analyse" description="Notre IA analyse votre morphologie faciale" />
            <Step number={3} title="Recommandations" description="Recevez des coiffures adaptées à votre visage" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface ResultCardProps {
  label: string;
  value?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ label, value }) => (
  <div className="glass-card rounded-xl p-4 text-center">
    <p className="text-slate-400 text-sm mb-1">{label}</p>
    <p className="text-white font-semibold">{value || '-'}</p>
  </div>
);

interface StepProps {
  number: number;
  title: string;
  description: string;
}

const Step: React.FC<StepProps> = ({ number, title, description }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-sm">
      {number}
    </div>
    <div>
      <h4 className="text-white font-medium mb-1">{title}</h4>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  </div>
);

export default FaceAnalysisPage;
