'use client';

import * as React from 'react';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, ShieldQuestion, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecurityWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  securityInfo: {
    score: number | null;
    riskLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
    threats?: Array<{
      type: string;
      description: string;
      severity: string;
      file?: string;
      remediation: string;
    }>;
    recommendations?: string[];
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
  skillName?: string;
}

const riskLevelConfig = {
  low: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: ShieldCheck,
    label: 'Low Risk',
  },
  medium: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: ShieldQuestion,
    label: 'Medium Risk',
  },
  high: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    icon: ShieldAlert,
    label: 'High Risk',
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: ShieldAlert,
    label: 'Critical Risk',
  },
  unknown: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: Shield,
    label: 'Unknown Risk',
  },
};

export function SecurityWarningModal({
  open,
  onOpenChange,
  securityInfo,
  onConfirm,
  onCancel,
  skillName,
}: SecurityWarningModalProps) {
  const riskLevel = securityInfo?.riskLevel || 'unknown';
  const config = riskLevelConfig[riskLevel];
  const Icon = config.icon;

  const isHighRisk = riskLevel === 'high' || riskLevel === 'critical';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className={isHighRisk ? 'text-red-500' : 'text-yellow-500'} />
            <h2 className="text-lg font-semibold">Security Warning</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            {skillName
              ? `The skill "${skillName}" has security concerns.`
              : 'This skill has security concerns.'}
          </p>

          {/* Risk Level Badge */}
          <div className={`flex items-center gap-2 p-3 rounded-md border ${config.borderColor} ${config.bgColor}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
            <div>
              <div className={`font-medium ${config.color}`}>{config.label}</div>
              {securityInfo?.score !== null && (
                <div className="text-sm text-gray-600">
                  Security Score: {securityInfo?.score}/100
                </div>
              )}
            </div>
          </div>

          {/* Threats List */}
          {securityInfo?.threats && securityInfo.threats.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Detected Threats:</h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {securityInfo.threats.slice(0, 5).map((threat, index) => (
                  <li
                    key={index}
                    className="text-sm p-2 bg-gray-50 rounded border-l-2 border-orange-400"
                  >
                    <div className="font-medium">{threat.type}</div>
                    <div className="text-gray-600">{threat.description}</div>
                    {threat.file && (
                      <div className="text-xs text-gray-500 mt-1">File: {threat.file}</div>
                    )}
                  </li>
                ))}
                {securityInfo.threats.length > 5 && (
                  <li className="text-sm text-gray-500 italic">
                    ...and {securityInfo.threats.length - 5} more threats
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {securityInfo?.recommendations && securityInfo.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {securityInfo.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500">-</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning Message */}
          <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <strong>Warning:</strong> Downloading and using this skill may pose security risks.
            Only proceed if you trust the source and understand the potential risks.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={isHighRisk ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            I understand, download anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
