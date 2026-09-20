import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

describe('Architecture Rules', () => {
    const srcPath = path.join(__dirname, '../src');
    const domainPath = path.join(srcPath, 'domain');
    const applicationPath = path.join(srcPath, 'application');

    const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
        const files = fs.readdirSync(dirPath);
    
        files.forEach((file) => {
            if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
                arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
            } else {
                if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('SyncService.ts')) { // Exclude SyncService for now
                    arrayOfFiles.push(path.join(dirPath, file));
                }
            }
        });
    
        return arrayOfFiles;
    };

    it('domain layer should not import from application or infrastructure layers', () => {
        const domainFiles = getAllFiles(domainPath);
        const illegalImportPatterns = [/from '..*\/application\//, /from '..*\/infrastructure\//];
        
        domainFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            illegalImportPatterns.forEach(pattern => {
                expect(content).not.toMatch(pattern);
            });
        });
    });

    it('application layer should not import from infrastructure layer', () => {
        const applicationFiles = getAllFiles(applicationPath);
        const illegalImportPattern = /from '..*\/infrastructure\//;

        applicationFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            expect(content).not.toMatch(illegalImportPattern);
        });
    });
});
