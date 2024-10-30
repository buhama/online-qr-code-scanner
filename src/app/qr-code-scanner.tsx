'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode'
import { Moon, Sun, Upload, Camera } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"

export default function QRCodeScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [scannerInitialized, setScannerInitialized] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrScannerRef = useRef<Html5Qrcode | null>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    qrScannerRef.current = new Html5Qrcode("qr-reader")
    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop()
      }
    }
  }, [])

  const onScanSuccess = (decodedText: string) => {
    setScanResult(decodedText)
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      qrScannerRef.current.stop()
    }
  }

  const onScanError = (error: string) => {
    console.error(error)
  }

  const startScanner = async () => {
    try {
      await qrScannerRef.current?.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanError
      )
      setScannerInitialized(true)
    } catch (err) {
      console.error(err)
    }
  }

  const stopScanner = () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      qrScannerRef.current.stop()
      setScannerInitialized(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        if (qrScannerRef.current?.isScanning) {
          await qrScannerRef.current.stop()
        }

        const tempDiv = document.createElement('div')
        tempDiv.id = 'qr-reader-file'
        document.body.appendChild(tempDiv)

        const html5QrcodeFile = new Html5Qrcode("qr-reader-file")
        
        try {
          const result = await html5QrcodeFile.scanFileV2(file)
          onScanSuccess(result.decodedText)
        } finally {
          await html5QrcodeFile.clear()
          document.body.removeChild(tempDiv)
        }
      } catch (error) {
        onScanError(String(error))
      }
    }
  }

  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    const item = items?.[0]

    if (item?.type.indexOf("image") !== -1) {
      const blob = item.getAsFile()
      if (blob) {
        try {
          if (qrScannerRef.current?.isScanning) {
            await qrScannerRef.current.stop()
          }

          const tempDiv = document.createElement('div')
          tempDiv.id = 'qr-reader-file'
          document.body.appendChild(tempDiv)

          const html5QrcodeFile = new Html5Qrcode("qr-reader-file")
          
          try {
            const result = await html5QrcodeFile.scanFileV2(blob)
            onScanSuccess(result.decodedText)
          } finally {
            await html5QrcodeFile.clear()
            document.body.removeChild(tempDiv)
          }
        } catch (error) {
          onScanError(String(error))
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">QR Code Scanner</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="camera">Camera</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="paste">Paste</TabsTrigger>
            </TabsList>
            <TabsContent value="camera">
              <div className="space-y-4">
                <div id="qr-reader" className="w-full h-64 bg-muted"></div>
                <Button
                  className="w-full"
                  onClick={scannerInitialized ? stopScanner : startScanner}
                >
                  {scannerInitialized ? "Stop Scanner" : "Start Scanner"}
                  <Camera className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="upload">
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Image
                  <Upload className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="paste">
              <div
                className="w-full h-64 border-2 border-dashed border-muted-foreground rounded-md flex items-center justify-center cursor-pointer"
                onPaste={handlePaste}
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                    navigator.clipboard.read().then(async (clipboardItems) => {
                      for (const clipboardItem of clipboardItems) {
                        for (const type of clipboardItem.types) {
                          if (type.startsWith('image/')) {
                            const blob = await clipboardItem.getType(type);
                            try {
                              if (qrScannerRef.current?.isScanning) {
                                await qrScannerRef.current.stop();
                              }

                              const tempDiv = document.createElement('div');
                              tempDiv.id = 'qr-reader-file';
                              document.body.appendChild(tempDiv);

                              const html5QrcodeFile = new Html5Qrcode("qr-reader-file");
                              try {
                                const file = new File([blob], "pasted-image.png", { type: blob.type });
                                const result = await html5QrcodeFile.scanFileV2(file);
                                onScanSuccess(result.decodedText);
                              } finally {
                                await html5QrcodeFile.clear();
                                document.body.removeChild(tempDiv);
                              }
                            } catch (error) {
                              onScanError(String(error));
                            }
                          }
                        }
                      }
                    }).catch(error => {
                      console.error('Failed to read clipboard:', error);
                    });
                  }
                }}
              >
                <p className="text-center text-muted-foreground">
                  Paste an image here (Cmd/Ctrl + V)
                </p>
              </div>
            </TabsContent>
          </Tabs>
          {scanResult && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="font-semibold mb-2">Scan Result:</h3>
              <p className="break-all">{scanResult}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}