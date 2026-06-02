import sys
with open('c:\\Users\\sebas\\Documents\\PFIM II 2026-1\\PFIM II previos\\2025_1_zip\\Tesis_2026_1_SebastianPeralta\\secciones\\capitulo3.tex', 'r', encoding='utf-8') as f:
    lines = f.readlines()

block1 = lines[0:118]
block5 = lines[118:196]
block2 = lines[196:347]
block3 = lines[347:558]
block4 = lines[558:580]
block6 = lines[580:]

for i in range(len(block2)):
    if '\\subsection{Arquitectura General del Sistema y Topología de Red}' in block2[i]:
        block2[i] = block2[i].replace('\\subsection{Arquitectura General del Sistema y Topología de Red}', '\\section{Arquitectura General del Sistema}\\n\\subsection{Topología de Red y Capas Físicas}')
        break

new_lines = block1 + block2 + block3 + block4 + block5 + block6

with open('c:\\Users\\sebas\\Documents\\PFIM II 2026-1\\PFIM II previos\\2025_1_zip\\Tesis_2026_1_SebastianPeralta\\secciones\\capitulo3.tex', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Success')