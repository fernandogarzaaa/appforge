import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function DocumentUpload({ projectId }) {
  const [isUploading, setIsUploading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [docData, setDocData] = useState({ name: '', description: '', tags: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success('Document deleted');
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setDocData({ ...docData, name: file.name });
      setShowDialog(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      await base44.entities.ProjectDocument.create({
        project_id: projectId,
        name: docData.name,
        description: docData.description,
        file_url: file_url,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        tags: docData.tags ? docData.tags.split(',').map(t => t.trim()) : []
      });

      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success('Document uploaded');
      setShowDialog(false);
      setDocData({ name: '', description: '', tags: '' });
      setSelectedFile(null);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-gray-900">Project Documents</h3>
        <label>
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.md"
          />
          <Button size="sm" className="h-7 text-[11px] bg-gray-900 hover:bg-gray-800" asChild>
            <span>
              <Upload className="w-3 h-3 mr-1.5" />
              Upload
            </span>
          </Button>
        </label>
      </div>

      <div className="space-y-2">
        {documents.length === 0 ? (
          <div className="text-center py-6 text-[11px] text-gray-400">
            No documents uploaded yet
          </div>
        ) : (
          documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 bg-white"
            >
              <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-900 truncate">{doc.name}</p>
                    {doc.description && (
                      <p className="text-[10px] text-gray-500 line-clamp-1">{doc.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 flex-shrink-0"
                    onClick={() => deleteMutation.mutate(doc.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                {doc.tags?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {doc.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] h-4 px-1.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Document Name</Label>
              <Input
                value={docData.name}
                onChange={(e) => setDocData({ ...docData, name: e.target.value })}
                className="h-9 text-[13px]"
              />
            </div>
            <div>
              <Label className="text-[12px]">Description (optional)</Label>
              <Textarea
                value={docData.description}
                onChange={(e) => setDocData({ ...docData, description: e.target.value })}
                className="text-[13px]"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-[12px]">Tags (comma-separated)</Label>
              <Input
                value={docData.tags}
                onChange={(e) => setDocData({ ...docData, tags: e.target.value })}
                placeholder="spec, design, requirements"
                className="h-9 text-[13px]"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !docData.name}
              className="w-full h-9 bg-gray-900 hover:bg-gray-800 text-[13px]"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}