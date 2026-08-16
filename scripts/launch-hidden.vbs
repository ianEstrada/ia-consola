' launch-hidden.vbs — lanza un programa OCULTO y DESACOPLADO de la consola.
' Uso: wscript.exe launch-hidden.vbs "ruta\al\exe.exe" "argumento1" "argumento2" ...
' El proceso sobrevive al cierre de la terminal que lo lanzó.
If WScript.Arguments.Count < 1 Then
    WScript.Echo "Uso: launch-hidden.vbs ""exe"" [args...]"
    WScript.Quit 1
End If

Dim shell, cmd, i
Set shell = CreateObject("WScript.Shell")
cmd = """" & WScript.Arguments(0) & """"
For i = 1 To WScript.Arguments.Count - 1
    cmd = cmd & " """ & WScript.Arguments(i) & """"
Next
shell.Run cmd, 0, False
