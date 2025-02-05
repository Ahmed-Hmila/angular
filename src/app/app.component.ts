import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { EmployeeService } from './services/employee.service';
import { Employee } from './models/employee.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<Employee>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Colonnes à exclure du tri
  nonSortableColumns = new Set([
    'imageUrl', 'isDeleting', 'position', 'department', 
    'adress', 'address', 'firstName', 'email', 'name', 'lastName','contactNumber'
  ]);

  // Colonnes où les nombres sont triés en premier
  numericFirstColumns = new Set(['age', 'dob', 'salary', 'contactNumber']);

  constructor(private employeeService: EmployeeService) {}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Empêcher le tri décroissant
    this.sort.sortChange.subscribe(() => {
      if (this.sort.direction === 'desc') {
        this.sort.direction = 'asc'; // Toujours revenir à un tri croissant
      }
    });

    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.displayedColumns = ['numero', ...this.getUniqueColumns(data)];
        this.dataSource.data = data;
        this.dataSource.sortingDataAccessor = this.sortingDataAccessor.bind(this);
      },
      error: (err) => console.error('Erreur lors du chargement des données:', err)
    });
  }

  getUniqueColumns(data: any[]): string[] {
    const columns = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => columns.add(key));
    });
    return Array.from(columns);
  }

  onPageChange(event: PageEvent): void {
    this.dataSource.paginator = this.paginator;
  }

  sortingDataAccessor(item: any, property: string): any {
    const value = item[property];
    
    // Vérifier si la valeur est "Non renseigné", null, ou vide, et la placer à la fin dans le tri croissant
    const isNonRenseigne = value === 'Non renseigné' || value === null || value === undefined || value === '';
    
    if (isNonRenseigne) {
      return Number.POSITIVE_INFINITY;  // Placer à la fin du tri croissant
    }
  
    // Vérifier si la colonne est exclue du tri
    if (this.nonSortableColumns.has(property)) {
      return null;  // Ne pas effectuer de tri pour cette colonne
    }
  
    // Si la colonne contient des nombres (par exemple age, salary), trier les nombres en premier
    if (this.numericFirstColumns.has(property)) {
      if (!isNaN(Number(value))) {
        return Number(value);  // Retourner la valeur numérique pour un tri correct
      } else {
        return Number.MAX_VALUE;  // Placer les non-numériques à la fin
      }
    }
  
    // Par défaut, trier les valeurs de texte
    return value;
  }
  

    // Colonnes de texte
   

  isSortable(column: string): boolean {
    return !this.nonSortableColumns.has(column);
  }
}